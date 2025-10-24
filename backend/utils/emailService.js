const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendEmail = async (options) => {
  const mailOptions = {
    from: `Inventory System <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Low Stock Alert Email
exports.sendLowStockAlert = async (userEmail, products) => {
  const productList = products.map(p => 
    `<li style="margin-bottom:8px;"><strong>${p.name}</strong> (SKU: ${p.sku})<br/>Current Stock: ${p.quantity} (Min: ${p.minStockLevel})</li>`
  ).join('');

  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 30px;">
      <h2 style="color: #d9534f; text-align: center;">⚠️ Low Stock Alert</h2>
      <p style="font-size: 16px; color: #333;">The following products are running low on stock:</p>
      <ul style="list-style-type: none; padding: 0; color: #555; font-size: 15px;">
        ${productList}
      </ul>
      <p style="font-size: 16px; margin-top: 20px; color: #333;">Please reorder these items soon to avoid stockouts.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="#" style="background-color: #007bff; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Go to Inventory</a>
      </div>
    </div>
    <p style="text-align: center; color: #888; margin-top: 15px;">Inventory Management System</p>
  </div>
  `;

  await this.sendEmail({
    email: userEmail,
    subject: 'Low Stock Alert - Inventory Management',
    html
  });
};

// Order Confirmation Email
exports.sendOrderConfirmation = async (email, order) => {
  const itemsList = order.items.map(item => 
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.product.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${item.price}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${item.total}</td>
    </tr>`
  ).join('');

  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f5f7fa; padding: 20px;">
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); padding: 30px;">
      <h2 style="color: #28a745; text-align: center;">✅ Order Confirmation</h2>
      <p style="font-size: 16px; color: #333;">Thank you for your order! Here are your order details:</p>
      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p><strong>Order Type:</strong> ${order.type}</p>
      <p><strong>Status:</strong> ${order.status}</p>

      <h3 style="margin-top: 25px; color: #007bff;">Items Ordered</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #007bff; color: #fff;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: left;">Qty</th>
            <th style="padding: 10px; text-align: left;">Price</th>
            <th style="padding: 10px; text-align: left;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
      </table>

      <div style="margin-top: 20px; font-size: 16px;">
        <p><strong>Subtotal:</strong> $${order.subtotal}</p>
        <p><strong>Tax:</strong> $${order.tax}</p>
        <p><strong>Discount:</strong> $${order.discount}</p>
        <p><strong>Total Amount:</strong> <span style="color:#28a745; font-weight: bold;">$${order.totalAmount}</span></p>
      </div>

      <p style="margin-top: 25px; color: #333;">We appreciate your business and hope you enjoy your purchase!</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="#" style="background-color: #28a745; color: white; padding: 10px 25px; border-radius: 6px; text-decoration: none;">View Your Order</a>
      </div>
    </div>
    <p style="text-align: center; color: #888; margin-top: 15px;">Inventory Management System</p>
  </div>
  `;

  await this.sendEmail({
    email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html
  });
};

// Welcome Email
exports.sendWelcomeEmail = async (email, name) => {
  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f9fafc; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); padding: 30px;">
      <h2 style="color: #007bff; text-align: center;">🎉 Welcome to Inventory Management System!</h2>
      <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
      <p style="font-size: 16px; color: #555;">Your account has been successfully created. You can now log in and start managing your inventory efficiently.</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="#" style="background-color: #007bff; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none;">Login Now</a>
      </div>
      <p style="font-size: 15px; color: #666;">If you have any questions or need assistance, feel free to reach out to our support team.</p>
      <p style="font-size: 16px; color: #333;">Best regards,<br/><strong>Inventory Management Team</strong></p>
    </div>
    <p style="text-align: center; color: #aaa; margin-top: 15px;">© ${new Date().getFullYear()} Inventory Management System</p>
  </div>
  `;

  await this.sendEmail({
    email,
    subject: 'Welcome to Inventory Management System',
    html
  });
};
