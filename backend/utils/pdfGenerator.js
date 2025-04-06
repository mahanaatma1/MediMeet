import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

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

            // Draw medical caduceus watermark in the background (faded)
            doc.save();
            doc.fillColor('#f0f0f0');
            doc.fontSize(200);
            doc.text('⚕', doc.page.width / 2 - 100, doc.page.height / 2 - 100, {
                align: 'center',
                opacity: 0.08
            });
            doc.restore();
            
            // ===== HEADER SECTION =====
            // Left side: Doctor information (using absolute positioning)
            doc.fontSize(16).fillColor(primaryColor).text(`Dr. ${doctorData.name}`, 50, 60);
            doc.fontSize(12).fillColor('#555').text(`${doctorData.degree || 'MBBS'}${doctorData.speciality ? ', ' + doctorData.speciality : ''}`, 50, 85);
            doc.fontSize(12).fillColor('#555').text(`Consultant ${doctorData.speciality || 'Physician'}`, 50, 105);
            
            // Doctor/Hospital Address
            doc.fontSize(10).fillColor('#666').text('MediMeet Hospital, 4th Block, SR Medical Center,', 50, 125);
            doc.fontSize(10).fillColor('#666').text('Healthcare Avenue, Bengaluru - 560001', 50, 140);
            
            // Doctor contact & appointment
            doc.fontSize(10).fillColor('#666').text(`📞 ${doctorData.phone || '080-XXXX-XXXX'}`, 50, 160);
            
            if (appointmentData) {
                const formattedDate = appointmentData.slotDate.replace(/_/g, '/');
                doc.fontSize(10).fillColor('#666').text(`📅 Next: ${formattedDate} ${appointmentData.slotTime}`, 200, 160);
            }
            
            // Right side: MediMeet Logo & info
            // Logo placeholder
            doc.rect(doc.page.width - 160, 60, 110, 30).fill('#3562d7');
            doc.fillColor('#fff').fontSize(18).text('MediMeet', doc.page.width - 150, 67);
            
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
            doc.fontSize(12).fillColor('#000').text(`${patientData.name} · ${patientData.age || '--'} Years · ${patientData.gender || 'Not Specified'}`, 50, 200);
            
            let currentY = 225; // Start tracking Y position
            
            // ===== VITALS & COMPLAINTS =====
            if (notes) {
                doc.fontSize(11).fillColor('#555').text('Complaints', 50, currentY);
                doc.fontSize(11).fillColor('#000').text(notes, 130, currentY, { width: 400 });
                currentY += 30; // Adjust based on content length
                
                if (notes.length > 50) {
                    currentY += 20; // Add more space for longer text
                }
            }
            
            // ===== DIAGNOSIS =====
            if (diagnosis) {
                doc.rect(50, currentY, 85, 20).fill('#fff0f0');
                doc.fontSize(11).fillColor(accentColor).text('Diagnosis', 55, currentY + 5);
                doc.fontSize(11).fillColor('#000').text(diagnosis, 140, currentY + 5, { width: 400 });
                currentY += 35;
            }
            
            // ===== MEDICATIONS =====
            // Rx Symbol
            doc.fontSize(36).fillColor('#000').text('Rx', 50, currentY);
            currentY += 40;
            
            if (medications.length > 0) {
                medications.forEach((med, index) => {
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
                        doc.fontSize(10).fillColor('#555').text(`Instructions: ${med.instructions || (med.timing ? 'Take ' + med.timing : '')}`, 80, currentY);
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
            currentY += 10; // Add extra space before this section
            doc.fontSize(12).fillColor('#000').text('Advice', 50, currentY);
            doc.fontSize(11).fillColor('#000').text('Review with reports', 140, currentY);
            
            // ===== SIGNATURE =====
            // Digital signature (can be replaced with actual signature image)
            const signatureY = doc.page.height - 100;
            doc.fontSize(11).fillColor('#000').text(doctorData.name, doc.page.width - 150, signatureY, { align: 'center' });
            doc.fontSize(10).fillColor('#000').text(`${doctorData.degree || 'MBBS'}, ${doctorData.speciality || 'MD Medicine'}`, doc.page.width - 150, signatureY + 15, { align: 'center' });
            doc.fontSize(9).fillColor('#555').text('MCI H00000', doc.page.width - 150, signatureY + 30, { align: 'center' });
            
            // Signature line
            doc.strokeColor('#000').lineWidth(1)
               .moveTo(doc.page.width - 200, signatureY - 10)
               .lineTo(doc.page.width - 100, signatureY - 10)
               .stroke();
               
            // ===== FOOTER =====
            doc.strokeColor('#aaaaaa').lineWidth(1)
               .moveTo(50, doc.page.height - 60)
               .lineTo(doc.page.width - 50, doc.page.height - 60)
               .dash(1, 2)
               .stroke();
               
            doc.fontSize(9).fillColor('#666').text(
                'Prescription generated with MediMeet',
                doc.page.width / 2, doc.page.height - 50, {
                    align: 'center'
                }
            );
            
            doc.fontSize(9).fillColor('#666').text(
                'Terms & Conditions · Privacy Policy',
                doc.page.width / 2, doc.page.height - 35, {
                    align: 'center'
                }
            );
            
            // Finalize PDF
            doc.end();
        } catch (error) {
            console.error('Error generating PDF:', error);
            reject(error);
        }
    });
}; 