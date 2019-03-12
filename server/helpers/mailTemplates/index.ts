// This is our MJML email header, it is a section with one column having text and an image
export const mailHeader = `
  <mj-section  background-color="#1034a6">
    <mj-column>
      <mj-text align="center" color="#F4F4FF"  font-size="24px">Welcome to Shop-Inc</mj-text>
      <mj-image
        src="https://res.cloudinary.com/shopinc/image/upload/v1552373736/shopinc.jpg"
        width="50px"/>
    </mj-column>
  </mj-section>
`;

export const mailBody = (name: string, verifyURL: string) => (
  `<mj-section background-color="#f4f4ff">
    <mj-column padding="5px">
      <mj-text font-size="20px" align="left" color="#0F0F0F">
            Hey ${name},
      </mj-text>
      <mj-text font-size="16px" line-height="150%" align="left" padding-left="30px" color="#0F0F0F">
Wowwee! Thanks for registering an account with Shop-inc! Before we get started, we'll need to verify your account.
      </mj-text>
      <mj-button background-color="#1034a6" href="${verifyURL}">
            Verify
      </mj-button>
    </mj-column>
  </mj-section>
`);

export const mailFooter = `
<mj-section background-color="#f4f4ff" padding-top="20px">
  <mj-column>
    <mj-divider border-color="#1034a6" border-width="1px"></mj-divider>
    <mj-text color="#0F0F4f" font-size="16px" align="center" line-height="150%">
      We don't have a way to unsubscribe to these emails so, sorry :(
      <br/>

      You could still follow us...
    </mj-text>
    <mj-social font-size="15px" icon-size="30px" mode="horizontal">
      <mj-social-element name="github" href="https://mjml.io/"/>
      <mj-social-element name="linkedin" href="https://mjml.io/"/>
      <mj-social-element  name="twitter" href="https://mjml.io/"/>
    </mj-social>
  </mj-column>
</mj-section>
`;
const generateMJMLTemplate = (name: string, verifyURL: string) => (
  `<mjml>
    <mj-body background-color="#ffffff">
      ${mailHeader}
      ${mailBody(name, verifyURL)}
      ${mailFooter}
    </mj-body>
    </mjml>
  `
);
export default generateMJMLTemplate;
