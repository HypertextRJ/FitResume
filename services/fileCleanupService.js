/**
 * Automatic File Cleanup Service
 * 
 * Privacy-First Principles:
 * 1. Immediate deletion after analysis
 * 2. Scheduled cleanup for orphaned files
 * 3. No permanent storage of resume content
 * 4. Fail-safe mechanisms
 */

const fs = require('fs').promises;
const path = require('path');

class FileCleanupService {
    constructor(uploadDir = 'uploads') {
        this.uploadDir = path.join(process.cwd(), uploadDir);
        this.maxFileAgeMinutes = 15; // Delete files older than 15 minutes
        this.cleanupIntervalMinutes = 5; // Run cleanup every 5 minutes
        this.cleanupTimer = null;
    }

    /**
     * Start scheduled cleanup job
     */
    startScheduledCleanup() {
        console.log(`🗑️  File cleanup service started`);
        console.log(`   - Checking every ${this.cleanupIntervalMinutes} minutes`);
        console.log(`   - Deleting files older than ${this.maxFileAgeMinutes} minutes`);

        // Run cleanup immediately on start
        this.runCleanup().catch(console.error);

        // Then schedule regular cleanups
        this.cleanupTimer = setInterval(() => {
            this.runCleanup().catch(console.error);
        }, this.cleanupIntervalMinutes * 60 * 1000);
    }

    /**
     * Stop scheduled cleanup
     */
    stopScheduledCleanup() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
            console.log('🛑 File cleanup service stopped');
        }
    }

    /**
     * Run cleanup operation
     */
    async runCleanup() {
        try {
            const stats = await this.cleanupOldFiles();

            if (stats.deletedCount > 0) {
                console.log(`🗑️  Cleanup completed: ${stats.deletedCount} files deleted`);
            }
        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
        }
    }

    /**
     * Clean up files older than threshold
     */
    async cleanupOldFiles() {
        let deletedCount = 0;
        let errorCount = 0;

        try {
            // Ensure upload directory exists
            await fs.mkdir(this.uploadDir, { recursive: true });

            // Read directory
            const files = await fs.readdir(this.uploadDir);

            const now = Date.now();
            const maxAgeMs = this.maxFileAgeMinutes * 60 * 1000;

            for (const file of files) {
                const filePath = path.join(this.uploadDir, file);

                try {
                    // Get file stats
                    const stats = await fs.stat(filePath);

                    // Skip if not a file
                    if (!stats.isFile()) continue;

                    // Check age
                    const fileAge = now - stats.mtimeMs;

                    if (fileAge > maxAgeMs) {
                        // Delete old file
                        await this.deleteFile(filePath);
                        deletedCount++;
                    }
                } catch (err) {
                    console.error(`Error processing file ${file}:`, err.message);
                    errorCount++;
                }
            }

            return {
                deletedCount,
                errorCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error in cleanup operation:', error.message);
            return { deletedCount: 0, errorCount: 1, timestamp: new Date().toISOString() };
        }
    }

    /**
     * Delete a single file (fail-safe)
     * @param {string} filePath - Path to file
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
            console.log(`   ✓ Deleted: ${path.basename(filePath)}`);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File already deleted, this is fine
                return true;
            }
            console.error(`   ✗ Failed to delete ${path.basename(filePath)}:`, error.message);
            return false;
        }
    }

    /**
     * Immediate cleanup after analysis
     * Called directly after processing a resume
     * 
     * @param {string} filePath - Path to uploaded file
     */
    async immediateCleanup(filePath) {
        if (!filePath) return false;

        try {
            await this.deleteFile(filePath);
            return true;
        } catch (error) {
            console.error('Immediate cleanup failed:', error.message);
            // Don't throw - scheduled cleanup will get it
            return false;
        }
    }

    /**
     * Emergency cleanup - delete all files in upload directory
     * Use with caution!
     */
    async emergencyCleanup() {
        console.warn('⚠️  Running EMERGENCY cleanup - deleting ALL uploaded files');

        try {
            const files = await fs.readdir(this.uploadDir);
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(this.uploadDir, file);
                const stats = await fs.stat(filePath);

                if (stats.isFile()) {
                    await this.deleteFile(filePath);
                    deletedCount++;
                }
            }

            console.log(`✅ Emergency cleanup complete: ${deletedCount} files deleted`);
            return { success: true, deletedCount };
        } catch (error) {
            console.error('❌ Emergency cleanup failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get cleanup statistics
     */
    async getStats() {
        try {
            const files = await fs.readdir(this.uploadDir);
            const now = Date.now();

            const fileStats = await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(this.uploadDir, file);
                    const stats = await fs.stat(filePath);

                    if (!stats.isFile()) return null;

                    const ageMinutes = Math.round((now - stats.mtimeMs) / 60000);

                    return {
                        name: file,
                        sizeKB: Math.round(stats.size / 1024),
                        ageMinutes,
                        willDeleteIn: Math.max(0, this.maxFileAgeMinutes - ageMinutes)
                    };
                })
            );

            const validFiles = fileStats.filter(f => f !== null);

            return {
                totalFiles: validFiles.length,
                files: validFiles,
                nextCleanupIn: this.cleanupIntervalMinutes,
                maxFileAge: this.maxFileAgeMinutes
            };
        } catch (error) {
            return {
                error: error.message,
                totalFiles: 0
            };
        }
    }
}

// Singleton instance
const cleanupService = new FileCleanupService('uploads');

// Graceful shutdown handler
process.on('SIGTERM', () => {
    console.log('SIGTERM received, running final cleanup...');
    cleanupService.emergencyCleanup()
        .then(() => {
            cleanupService.stopScheduledCleanup();
            process.exit(0);
        })
        .catch(() => process.exit(1));
});

process.on('SIGINT', () => {
    console.log('SIGINT received, running final cleanup...');
    cleanupService.emergencyCleanup()
        .then(() => {
            cleanupService.stopScheduledCleanup();
            process.exit(0);
        })
        .catch(() => process.exit(1));
});

module.exports = cleanupService;
