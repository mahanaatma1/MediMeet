import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import SVGtoPDF from 'svg-to-pdfkit';

// Base64 encoded MediMeet logo SVG
const MEDIMEET_LOGO_SVG = `<svg width="217" height="46" viewBox="0 0 217 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22.9997 0C35.7026 0 45.9997 10.2971 45.9997 23V39.1C45.9997 40.93 45.2728 42.685 43.9788 43.979C42.6848 45.273 40.9297 46 39.0997 46H24.1497V35.9099C24.1497 33.6076 24.29 31.2225 25.4975 29.2629C26.362 27.8586 27.5185 26.6566 28.8884 25.7385C30.2583 24.8204 31.8096 24.2077 33.4371 23.9419L33.8776 23.8706C34.0592 23.8085 34.2168 23.6912 34.3284 23.5351C34.44 23.379 34.5 23.1919 34.5 23C34.5 22.8081 34.44 22.621 34.3284 22.4649C34.2168 22.3088 34.0592 22.1915 33.8776 22.1294L33.4371 22.0581C31.0591 21.6697 28.8632 20.5441 27.1594 18.8403C25.4556 17.1365 24.3301 14.9406 23.9416 12.5626L23.8703 12.1222C23.8082 11.9406 23.6909 11.7829 23.5348 11.6713C23.3787 11.5597 23.1916 11.4997 22.9997 11.4997C22.8078 11.4997 22.6208 11.5597 22.4647 11.6713C22.3086 11.7829 22.1913 11.9406 22.1292 12.1222L22.0579 12.5626C21.7922 14.1902 21.1795 15.7415 20.2614 17.1114C19.3433 18.4814 18.1412 19.6378 16.7368 20.5022C14.7772 21.7097 12.3921 21.85 10.0898 21.85H0.0273438C0.628794 9.68185 10.6832 0 22.9997 0Z" fill="#5F6FFF"/>
<path d="M0 24.15H10.0901C12.3924 24.15 14.7775 24.2903 16.7371 25.4978C18.2689 26.4417 19.5583 27.7311 20.5022 29.2629C21.7097 31.2225 21.85 33.6076 21.85 35.9099V46H6.9C5.07001 46 3.31496 45.273 2.02096 43.979C0.726962 42.685 0 40.93 0 39.1L0 24.15ZM46 2.3C46 2.91 45.7577 3.49501 45.3263 3.92635C44.895 4.35768 44.31 4.6 43.7 4.6C43.09 4.6 42.505 4.35768 42.0737 3.92635C41.6423 3.49501 41.4 2.91 41.4 2.3C41.4 1.69 41.6423 1.10499 42.0737 0.673654C42.505 0.242321 43.09 0 43.7 0C44.31 0 44.895 0.242321 45.3263 0.673654C45.7577 1.10499 46 1.69 46 2.3Z" fill="#5F6FFF"/>


    <!-- Text with Custom Styling -->
    <text x="50" y="40"
      font-family="'Open Sans', sans-serif"
      font-size="33"
      font-weight="600"
      fill="#000B6D"
      letter-spacing="1.5">
    MediMeet
</text>


</svg>`;

// Function to generate PDF from prescription data
export const generatePDF = async (prescription) => {
    return new Promise((resolve, reject) => {
        try {
            // Create a new PDF document with better margins
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                info: {
                    Title: 'Medical Prescription',
                    Author: 'MediMeet',
                    Subject: 'Medical Prescription'
                }
            });
            
            // Buffer to store PDF
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            // Extract data
            const {
                patientData,
                doctorData,
                medications,
                diagnosis,
                notes,
                followUpDate,
                followUpInstructions,
                createdAt,
                digitalSignature,
                appointmentData
            } = prescription;
            
            // Define colors
            const primaryColor = '#3562d7'; // Blue
            const secondaryColor = '#1e40af'; // Darker blue
            const accentColor = '#ef4444'; // Red for important info
            const backgroundColor = '#f3f4f6'; // Light gray for sections
            
            // Set default font
            doc.font('Helvetica');

            // ===== HEADER SECTION =====
            // Left side: Doctor information (using absolute positioning)
            doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(`Dr. ${doctorData.name}`, 50, 60);
            doc.fontSize(12).fillColor('#444').font('Helvetica').text(`${doctorData.degree || 'MBBS'}${doctorData.speciality ? ', ' + doctorData.speciality : ''}`, 50, 85);
            doc.fontSize(12).fillColor('#444').text(`Consultant ${doctorData.speciality || 'Physician'}`, 50, 105);
            
            // Doctor/Hospital Address with improved icons and formatting
            doc.fontSize(10).fillColor('#555').text('MediMeet Hospital, 4th Block, SR Medical Center,', 50, 125);
            doc.fontSize(10).fillColor('#555').text('Healthcare Avenue, Bengaluru - 560001', 50, 140);
            
            // Doctor contact & appointment - improved alignment and layout
            doc.fontSize(10).fillColor('#555');
            
            // Contact information with consistent alignment
            const leftColumnX = 50;
            const rightColumnX = doc.page.width / 2;
            const contactY = 160;
            const contactLabelWidth = 80;
            
            // Phone - left column with aligned label and value
            doc.text("Phone:", leftColumnX, contactY, { width: contactLabelWidth, continued: false });
            doc.text('080-12345678', leftColumnX + contactLabelWidth, contactY, { width: 120 });
            
            // Appointment - right column with aligned label and value
            if (appointmentData) {
                const formattedDate = appointmentData.slotDate.replace(/_/g, '/');
                doc.text("Appointment:", rightColumnX, contactY, { width: contactLabelWidth, continued: false });
                doc.text(`${formattedDate} ${appointmentData.slotTime}`, rightColumnX + contactLabelWidth, contactY, { width: 150 });
            }
            
            // Right side: MediMeet Logo & info
            // Add the MediMeet Logo from SVG
            SVGtoPDF(doc, MEDIMEET_LOGO_SVG, doc.page.width - 220, 50, {
                width: 170,
                height: 40
            });
            
            doc.fontSize(8).fillColor('#666').text('HealthTech Solutions Inc.', doc.page.width - 160, 100);
            doc.fontSize(8).fillColor('#666').text('contact@medimeet.com', doc.page.width - 160, 115);
            doc.fontSize(8).fillColor('#666').text('www.medimeet.com', doc.page.width - 160, 130);
            
            // Separator line
            doc.strokeColor('#aaaaaa').lineWidth(1)
               .moveTo(50, 180)
               .lineTo(doc.page.width - 50, 180)
               .dash(1, 2)
               .stroke();
            
            // ===== PATIENT INFORMATION =====
            doc.fontSize(12).fillColor('#000').text(`${patientData.name} · ${patientData.age || ''} Years · ${patientData.gender || 'Not Specified'}`, 50, 200);
            
            let currentY = 225; // Start tracking Y position
            const contentMaxY = doc.page.height - 80; // Leave space at bottom
            
            // ===== VITALS & COMPLAINTS =====
            if (notes) {
                // Check if we need more space
                if (currentY + 30 > contentMaxY) {
                    doc.addPage(); // Add new page
                    currentY = 50; // Reset Y position
                }
                
                doc.fontSize(11).fillColor('#555').text('Complaints', 50, currentY);
                
                // Calculate the height needed for the notes text
                const textHeight = doc.heightOfString(notes, { width: 400 });
                doc.fontSize(11).fillColor('#000').text(notes, 130, currentY, { width: 400 });
                
                // Adjust currentY based on actual text height
                currentY += Math.max(30, textHeight + 10);
            }
            
            // ===== DIAGNOSIS =====
            if (diagnosis) {
                // Check if we need more space
                if (currentY + 50 > contentMaxY) {
                    doc.addPage(); // Add new page
                    currentY = 50; // Reset Y position
                }
                
                doc.rect(50, currentY, 85, 20).fill('#fff0f0');
                doc.fontSize(11).fillColor(accentColor).text('Diagnosis', 55, currentY + 5);
                
                // Calculate the height needed for the diagnosis text
                const diagnosisHeight = doc.heightOfString(diagnosis, { width: 400 });
                doc.fontSize(11).fillColor('#000').text(diagnosis, 140, currentY + 5, { width: 400 });
                
                // Adjust currentY based on actual text height
                currentY += Math.max(35, diagnosisHeight + 15);
            }
            
            // ===== MEDICATIONS =====
            if (medications.length > 0) {
                medications.forEach((med, index) => {
                    // Calculate height needed for this medication
                    const medHeight = 60 + (med.instructions || med.timing ? 15 : 0);
                    
                    // Check if we need more space
                    if (currentY + medHeight > contentMaxY) {
                        doc.addPage(); // Add new page
                        currentY = 50; // Reset Y position
                    }
                    
                    // Medication number and name
                    doc.fontSize(12).fillColor('#000').text(`${index + 1}. ${med.name}`, 60, currentY);
                    currentY += 20;
                    
                    // Chemical composition in italics
                    const compositionText = `${med.name.includes('(') ? '' : '('}${med.dosage}${med.name.includes(')') ? '' : ')'}`;
                    doc.fontSize(10).fillColor('#555').text(compositionText, 80, currentY);
                    currentY += 15;
                    
                    // Dosage info
                    const dosageText = `1 tablet - ${med.frequency.toLowerCase().includes('daily') ? med.frequency : med.frequency + ' for ' + med.duration}`;
                    doc.fontSize(11).fillColor('#000').text(dosageText, 80, currentY);
                    currentY += 15;
                    
                    // Instructions
                    if (med.instructions || med.timing) {
                        const instructionsText = `Instructions: ${med.instructions || (med.timing ? 'Take ' + med.timing : '')}`;
                        doc.fontSize(10).fillColor('#555').text(instructionsText, 80, currentY);
                        currentY += 15;
                    }
                    
                    currentY += 10; // Add space between medications
                });
            } else {
                doc.fontSize(12).fillColor('#666').text('No medications prescribed', 80, currentY, { italic: true });
                currentY += 20;
            }
            
            // ===== INVESTIGATIONS (if any) =====
            if (followUpDate) {
                // Check if we need more space
                if (currentY + 60 > contentMaxY) {
                    doc.addPage(); // Add new page
                    currentY = 50; // Reset Y position
                }
                
                currentY += 10; // Add extra space before this section
                doc.fontSize(12).fillColor('#000').text('Investigations', 50, currentY);
                currentY += 20;
                
                doc.fontSize(11).fillColor('#000').text(`1. Follow-up on ${new Date(followUpDate).toLocaleDateString()}`, 60, currentY);
                currentY += 15;
                
                if (followUpInstructions) {
                    doc.fontSize(10).fillColor('#555').text(`   Instructions: ${followUpInstructions}`, 60, currentY);
                    currentY += 15;
                }
                
                currentY += 10;
            }
            
            // ===== ADVICE =====
            // Check if we need more space
            if (currentY + 40 > contentMaxY) {
                doc.addPage(); // Add new page
                currentY = 50; // Reset Y position
            }
            
            currentY += 10; // Add extra space before this section
            doc.fontSize(12).fillColor('#000').text('Advice', 50, currentY);
            doc.fontSize(11).fillColor('#000').text('Review with reports', 140, currentY);
            
            // Make sure we have enough space for signature
            if (currentY + 100 > contentMaxY) {
                doc.addPage(); // Add new page
                currentY = 50; // Reset Y position
            }
            
            // ===== SIGNATURE =====
            // Better positioned signature that won't go out of bounds
            const signatureY = doc.page.height - 130; // Increased space to avoid overlap
            const signatureWidth = 180;
            const signatureX = doc.page.width - signatureWidth - 50; // Keep from right edge
            
            // Add a rectangle background for the signature area
            doc.rect(signatureX, signatureY - 20, signatureWidth, 60).fill('#f8f8f8');
            
            // Doctor name and credentials - positioned FIRST before the line
            const signatureCenterX = signatureX + (signatureWidth / 2);
            doc.fontSize(11).fillColor('#000').text(doctorData.name, signatureCenterX, signatureY, { 
                align: 'center',
                width: signatureWidth - 20
            });
            doc.fontSize(10).fillColor('#444').text(`${doctorData.degree || 'MBBS'}, ${doctorData.speciality || 'Medicine'}`, signatureCenterX, signatureY + 15, { 
                align: 'center',
                width: signatureWidth - 20
            });
            doc.fontSize(9).fillColor('#555').text('Registration: MCI H00000', signatureCenterX, signatureY + 30, { 
                align: 'center',
                width: signatureWidth - 20
            });
            
            // Signature line - positioned AFTER the text, above all the text
            const lineY = signatureY - 10; // Position the line above the name
            const lineStartX = signatureX + 20;
            const lineEndX = signatureX + signatureWidth - 20;
            doc.strokeColor('#000').lineWidth(1)
               .moveTo(lineStartX, lineY)
               .lineTo(lineEndX, lineY)
               .stroke();
            
            // Finalize the PDF
            doc.end();
        } catch (error) {
            console.error('Error generating PDF:', error);
            reject(error);
        }
    });
}; 