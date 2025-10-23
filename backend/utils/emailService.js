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


exports.sendLowStockAlert = async (userEmail, products) => {
  const productList = products.map(p => 
    `<li><strong>${p.name}</strong> (SKU: ${p.sku}) - Current Stock: ${p.quantity} (Min: ${p.minStockLevel})</li>`
  ).join('');

  const html = `
    <h2>Low Stock Alert</h2>
    <p>The following products are running low on stock:</p>
    <ul>
      ${productList}
    </ul>
    <p>Please reorder these items soon.</p>
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
    `<li>${item.product.name} - Qty: ${item.quantity} - Price: $${item.price} - Total: $${item.total}</li>`
  ).join('');

  const html = `
    <h2>Order Confirmation</h2>
    <p>Order Number: <strong>${order.orderNumber}</strong></p>
    <p>Order Type: <strong>${order.type}</strong></p>
    <p>Status: <strong>${order.status}</strong></p>
    <h3>Items:</h3>
    <ul>
      ${itemsList}
    </ul>
    <p><strong>Subtotal:</strong> $${order.subtotal}</p>
    <p><strong>Tax:</strong> $${order.tax}</p>
    <p><strong>Discount:</strong> $${order.discount}</p>
    <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
    <p>Thank you for your order!</p>
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
    <h2>Welcome to Inventory Management System!</h2>
    <p>Hi ${name},</p>
    <p>Your account has been successfully created.</p>
    <p>You can now login and start managing your inventory.</p>
    <p>Best regards,<br/>Inventory Management Team</p>
  `;

  await this.sendEmail({
    email,
    subject: 'Welcome to Inventory Management System',
    html
  });
};