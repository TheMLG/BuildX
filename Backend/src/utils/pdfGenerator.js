import PDFDocument from 'pdfkit';

export const generateBillPDF = (order, stream) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      
      // Pipe to the stream
      doc.pipe(stream);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', { align: 'center' })
        .moveDown();

      // Company info (you can customize this)
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('BuildX Store', { align: 'center' })
        .text('Email: store@buildx.com', { align: 'center' })
        .moveDown();

      // Horizontal line
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown();

      // Order details
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Order ID: ${order.orderId}`, 50, doc.y)
        .font('Helvetica')
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 350, doc.y - 12)
        .moveDown();

      // Customer information
      doc
        .font('Helvetica-Bold')
        .text('Bill To:', 50, doc.y)
        .font('Helvetica')
        .text(order.customerInfo.name)
        .text(order.customerInfo.email)
        .text(order.customerInfo.phone)
        .moveDown();

      // Payment info
      doc
        .font('Helvetica-Bold')
        .text(`Payment Status: `, 50, doc.y, { continued: true })
        .font('Helvetica')
        .text(order.paymentInfo.status.toUpperCase())
        .font('Helvetica-Bold')
        .text(`Payment Method: `, 50, doc.y, { continued: true })
        .font('Helvetica')
        .text(order.paymentInfo.method.toUpperCase());

      if (order.paymentInfo.transactionId) {
        doc
          .font('Helvetica-Bold')
          .text(`Transaction ID: `, 50, doc.y, { continued: true })
          .font('Helvetica')
          .text(order.paymentInfo.transactionId);
      }
      
      doc.moveDown(2);

      // Table header
      const tableTop = doc.y;
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Item', 50, tableTop)
        .text('Quantity', 300, tableTop)
        .text('Price', 380, tableTop)
        .text('Total', 460, tableTop, { align: 'right' });

      // Draw line under header
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table rows
      let yPosition = tableTop + 25;
      doc.font('Helvetica').fontSize(10);

      order.items.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        
        doc
          .text(item.name, 50, yPosition, { width: 230 })
          .text(item.quantity.toString(), 300, yPosition)
          .text(`$${item.price.toFixed(2)}`, 380, yPosition)
          .text(`$${itemTotal.toFixed(2)}`, 460, yPosition, { align: 'right' });

        yPosition += 25;
      });

      // Draw line before total
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, yPosition)
        .lineTo(550, yPosition)
        .stroke();

      // Total
      yPosition += 15;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('TOTAL:', 380, yPosition)
        .text(`$${order.totalAmount.toFixed(2)}`, 460, yPosition, { align: 'right' });

      // Footer
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          'Thank you for your business!',
          50,
          doc.page.height - 100,
          { align: 'center', width: 500 }
        );

      // Finalize PDF
      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', (error) => reject(error));
    } catch (error) {
      reject(error);
    }
  });
};
