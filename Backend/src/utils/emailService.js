import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  // For development/testing, you can use services like Gmail, Ethereal, or Mailtrap
  // For production, use a proper SMTP service
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password',
    },
  });
};

export const sendBillEmail = async (order, pdfBuffer) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email credentials not configured. Skipping email send.');
      console.log(`Would have sent bill to: ${order.customerInfo.email}`);
      return { messageId: 'skipped-no-credentials' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"BuildX Store" <noreply@buildx.com>',
      to: order.customerInfo.email,
      subject: `Your Order Invoice - ${order.orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Order!</h1>
            </div>
            <div class="content">
              <p>Dear ${order.customerInfo.name},</p>
              <p>Thank you for your purchase. Your order has been confirmed and is being processed.</p>
              
              <div class="order-details">
                <h3>Order Details:</h3>
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
                <p><strong>Payment Status:</strong> ${order.paymentInfo.status}</p>
                ${order.paymentInfo.transactionId ? `<p><strong>Transaction ID:</strong> ${order.paymentInfo.transactionId}</p>` : ''}
              </div>

              <h3>Items Ordered:</h3>
              <ul>
                ${order.items.map(item => `
                  <li>${item.name} - Qty: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>
                `).join('')}
              </ul>

              <p>Please find your invoice attached as a PDF.</p>
              
              <p>If you have any questions about your order, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; 2026 BuildX Store. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Invoice_${order.orderId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    console.error('Email config - Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.error('Email config - Port:', process.env.EMAIL_PORT || '587');
    console.error('Email config - User:', process.env.EMAIL_USER || 'not configured');
    // Don't throw error, just log it and continue
    console.log('Email sending failed but continuing...');
    return { messageId: 'failed', error: error.message };
  }
};

export const sendOrderConfirmationEmail = async (order) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email credentials not configured. Skipping confirmation email.');
      console.log(`Would have sent confirmation to: ${order.customerInfo.email}`);
      return { messageId: 'skipped-no-credentials' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"BuildX Store" <noreply@buildx.com>',
      to: order.customerInfo.email,
      subject: `Order Confirmation - ${order.orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed!</h1>
            </div>
            <div class="content">
              <p>Dear ${order.customerInfo.name},</p>
              <p>Your order <strong>${order.orderId}</strong> has been confirmed.</p>
              <p>Thank you for shopping with us!</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending confirmation email:', error.message);
    console.error('Email config - Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.error('Email config - Port:', process.env.EMAIL_PORT || '587');
    console.error('Email config - User:', process.env.EMAIL_USER || 'not configured');
    // Don't throw error, just log it and continue
    console.log('Confirmation email failed but continuing...');
    return { messageId: 'failed', error: error.message };
  }
};
