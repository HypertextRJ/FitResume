const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

/**
 * Resume Parser Service
 * Extracts text and metadata from PDF and DOCX resume files
 */

class ResumeParser {
    /**
     * Main entry point - parses resume and returns structured data
     * @param {string} filePath - Path to the resume file
     * @returns {Promise<Object>} Parsed resume data
     */
    async parseResume(filePath) {
        const ext = path.extname(filePath).toLowerCase();

        let rawText;
        if (ext === '.pdf') {
            rawText = await this.parsePDF(filePath);
        } else if (ext === '.docx' || ext === '.doc') {
            rawText = await this.parseDOCX(filePath);
        } else {
            throw new Error(`Unsupported file format: ${ext}`);
        }

        // Extract structured data from raw text
        const structured = this.extractStructuredData(rawText);

        return {
            rawText,
            ...structured,
            parseQuality: this.assessParseQuality(rawText)
        };
    }

    /**
     * Parse PDF file
     */
    async parsePDF(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        } catch (error) {
            throw new Error(`Failed to parse PDF: ${error.message}`);
        }
    }

    /**
     * Parse DOCX file
     */
    async parseDOCX(filePath) {
        try {
            const buffer = await fs.readFile(filePath);
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } catch (error) {
            throw new Error(`Failed to parse DOCX: ${error.message}`);
        }
    }

    /**
     * Extract structured information from raw text
     */
    extractStructuredData(text) {
        return {
            contact: this.extractContact(text),
            experience: this.extractExperience(text),
            education: this.extractEducation(text),
            skills: this.extractSkills(text),
            totalYearsExperience: this.calculateTotalExperience(text)
        };
    }

    /**
     * Extract contact information
     */
    extractContact(text) {
        const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/;
        const phoneRegex = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/;

        const emailMatch = text.match(emailRegex);
        const phoneMatch = text.match(phoneRegex);

        return {
            email: emailMatch ? emailMatch[0] : null,
            phone: phoneMatch ? phoneMatch[0] : null
        };
    }

    /**
     * Extract experience information
     */
    extractExperience(text) {
        const experiences = [];

        // Look for common experience section headers
        const experienceSection = this.extractSection(text, [
            'experience', 'work experience', 'employment history',
            'professional experience', 'work history'
        ]);

        if (experienceSection) {
            // Split by common date patterns to identify individual experiences
            const yearPattern = /\b(19|20)\d{2}\b/g;
            const matches = experienceSection.match(yearPattern);

            if (matches && matches.length > 0) {
                experiences.push({
                    section: experienceSection,
                    yearsFound: matches
                });
            }
        }

        return experiences;
    }

    /**
     * Extract education information
     */
    extractEducation(text) {
        const education = [];

        // Common degree patterns
        const degreePatterns = [
            /\b(Ph\.?D\.?|Doctorate|Doctoral)\b/gi,
            /\b(Master['']?s?|M\.?S\.?|M\.?A\.?|MBA|M\.Tech|M\.E\.)\b/gi,
            /\b(Bachelor['']?s?|B\.?S\.?|B\.?A\.?|B\.Tech|B\.E\.)\b/gi,
            /\b(Associate['']?s?|A\.?S\.?|A\.?A\.?)\b/gi,
            /\b(Diploma|Certificate)\b/gi
        ];

        degreePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                education.push(...matches);
            }
        });

        return [...new Set(education)]; // Remove duplicates
    }

    /**
     * Extract skills from text
     */
    extractSkills(text) {
        const skillsSection = this.extractSection(text, [
            'skills', 'technical skills', 'core competencies',
            'technologies', 'expertise', 'proficiencies'
        ]);

        if (!skillsSection) {
            return [];
        }

        // Common skill delimiters
        const skills = skillsSection
            .split(/[,;•\n\r|\-]/)
            .map(s => s.trim())
            .filter(s => s.length > 1 && s.length < 50)
            .filter(s => !/^(skills|technical|core|competencies)$/i.test(s));

        return skills;
    }

    /**
     * Calculate total years of experience
     */
    calculateTotalExperience(text) {
        // Extract all 4-digit years
        const years = text.match(/\b(19|20)\d{2}\b/g);

        if (!years || years.length < 2) {
            return 0;
        }

        // Convert to numbers and sort
        const numericYears = years.map(y => parseInt(y)).sort((a, b) => a - b);

        // Check for "present", "current", "ongoing" to determine if still employed
        const isCurrentlyEmployed = /\b(present|current|ongoing|now)\b/i.test(text);
        const currentYear = new Date().getFullYear();

        // Calculate experience: latest year (or current year) - earliest year
        const earliestYear = numericYears[0];
        const latestYear = isCurrentlyEmployed ? currentYear : numericYears[numericYears.length - 1];

        return Math.max(0, latestYear - earliestYear);
    }

    /**
     * Extract a section from text based on headers
     */
    extractSection(text, headers) {
        const lowerText = text.toLowerCase();

        for (const header of headers) {
            const headerIndex = lowerText.indexOf(header.toLowerCase());
            if (headerIndex === -1) continue;

            // Find the next section (common headers)
            const nextSectionHeaders = [
                'education', 'experience', 'skills', 'projects',
                'certifications', 'awards', 'publications', 'references'
            ];

            let endIndex = text.length;
            for (const nextHeader of nextSectionHeaders) {
                const nextIndex = lowerText.indexOf(nextHeader.toLowerCase(), headerIndex + header.length);
                if (nextIndex !== -1 && nextIndex < endIndex) {
                    endIndex = nextIndex;
                }
            }

            return text.substring(headerIndex, endIndex);
        }

        return null;
    }

    /**
     * Assess the quality of the parse
     * Used for the Format & Clarity scoring category
     */
    assessParseQuality(text) {
        let quality = 5; // Start with perfect score

        // Deduct for very short resumes (likely parsing issues)
        if (text.length < 500) {
            quality -= 3;
        } else if (text.length < 1000) {
            quality -= 1;
        }

        // Deduct for excessive special characters (likely formatting issues)
        const specialChars = text.match(/[^\w\s.,;:()\-'"@]/g) || [];
        if (specialChars.length > text.length * 0.1) {
            quality -= 2;
        }

        // Deduct for lack of structure (no common section headers)
        const hasStructure = /\b(experience|education|skills)\b/i.test(text);
        if (!hasStructure) {
            quality -= 2;
        }

        return Math.max(0, quality);
    }
}

module.exports = new ResumeParser();
