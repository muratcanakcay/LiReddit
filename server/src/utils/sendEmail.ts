import nodemailer from "nodemailer";

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail(to: string, subject: string, text: string) {
  //let testAccount = await nodemailer.createTestAccount();
  //console.log("testAccount: ", testAccount);

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: "i3sabqkaflvfyrhh@ethereal.email", //testAccount.user,
      pass: "BS85g71pdwCQDEz5Bz", //testAccount.pass,
    },
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@ethereal.email>',
    to,
    subject,
    html: text,
  });

  console.log("Message sent: %s", info.messageId);
  console.log("PreviewURL: %s", nodemailer.getTestMessageUrl(info));
}
