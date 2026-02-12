/**
 * Send email notification to shop owner
 * 
 * This is used as a fallback when WhatsApp fails
 * 
 * @param {Object} orderData - Order details
 * @returns {Promise<boolean>} Success status
 */
async function sendEmailToOwner(orderData) {
    if (!resend) {
        console.log('Resend not configured');
        return false;
    }

    try {
        const itemsList = orderData.items
            .map(item => `<li>${item.productName} (${item.quantity}x ${item.unit}) - ₹${item.subtotal}</li>`)
            .join('');

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .total { font-size: 20px; font-weight: bold; color: #2563EB; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 NEW ORDER!</h1>
          </div>
          
          <div class="content">
            <div class="order-details">
              <h3>Order #${orderData.orderId}</h3>
              <p><strong>Time:</strong> ${new Date(orderData.createdAt).toLocaleString('en-IN')}</p>
              
              <h4>Customer Details:</h4>
              <p>
                <strong>Name:</strong> ${orderData.customer.name}<br>
                <strong>Phone:</strong> ${orderData.customer.phone}<br>
                <strong>Address:</strong> ${orderData.customer.address}
                ${orderData.customer.landmark ? `<br><strong>Landmark:</strong> ${orderData.customer.landmark}` : ''}
              </p>
              
              <h4>Items:</h4>
              <ul>${itemsList}</ul>
              
              <p class="total">Total: ₹${orderData.total}</p>
              
              <p>
                <strong>Delivery Slot:</strong> ${orderData.deliverySlot}<br>
                <strong>Payment:</strong> Cash on Delivery
              </p>
              
              ${orderData.specialInstructions ? `<p><strong>Special Instructions:</strong> ${orderData.specialInstructions}</p>` : ''}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

        await resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: 'jayeshrajput@example.com', // Replace with actual owner email
            subject: `🛒 NEW ORDER - ${orderData.orderId}`,
            html
        });

        console.log('Email notification sent to owner');
        return true;
    } catch (error) {
        console.error('Error sending email to owner:', error);
        return false;
    }
}

// Insert this function after sendWhatsAppNotification and before sendEmailConfirmation
