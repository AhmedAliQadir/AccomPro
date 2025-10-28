import { Router } from 'express';
import { authenticate, authorizePlatformAdmin } from '../middleware/auth';
import { generateAccommodateMEPresentation } from '../lib/presentation-generator';

const router = Router();

// Generate and download AccommodateME presentation PDF
router.get('/download', authenticate, authorizePlatformAdmin, async (req, res) => {
  try {
    const presentationData = {
      organizationName: 'ORBIXIO LTD',
      generatedDate: new Date()
    };

    const pdfStream = generateAccommodateMEPresentation(presentationData);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="AccommodateME-Presentation-${new Date().toISOString().split('T')[0]}.pdf"`
    );
    
    // Pipe the PDF stream to response
    pdfStream.pipe(res);
    
    // Handle errors
    pdfStream.on('error', (error) => {
      console.error('PDF generation error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to generate presentation' });
      }
    });
    
  } catch (error) {
    console.error('Presentation generation error:', error);
    res.status(500).json({ message: 'Failed to generate presentation' });
  }
});

export default router;
