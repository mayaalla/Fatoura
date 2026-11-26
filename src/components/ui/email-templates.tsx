interface EmailTemplateProps {
  firstName: string;
}

export function EmailTemplate({ firstName }: EmailTemplateProps) {
  const greetingName = firstName.trim() || 'there';

  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{
        backgroundColor: '#f5f6f7',
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: '32px 12px',
        width: '100%',
      }}
    >
      <tbody>
        <tr>
          <td align="center">
            <table
              role="presentation"
              width={600}
              cellPadding={0}
              cellSpacing={0}
              border={0}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                maxWidth: '600px',
                overflow: 'hidden',
                width: '100%',
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: '24px 28px' }}>
                    <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                      <tbody>
                        <tr>
                          <td
                            align="center"
                            style={{
                              backgroundColor: '#d9612b',
                              borderRadius: '9px',
                              color: '#ffffff',
                              fontSize: '18px',
                              fontWeight: 700,
                              height: '36px',
                              lineHeight: '36px',
                              width: '36px',
                            }}
                          >
                            F
                          </td>
                          <td
                            style={{
                              color: '#303538',
                              fontSize: '18px',
                              fontWeight: 700,
                              paddingLeft: '10px',
                            }}
                          >
                            Fatoura
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      backgroundColor: '#303538',
                      color: '#ffffff',
                      padding: '32px 28px',
                    }}
                  >
                    <h1
                      style={{
                        color: '#ffffff',
                        fontSize: '30px',
                        fontWeight: 700,
                        letterSpacing: '-0.7px',
                        lineHeight: 1.2,
                        margin: '0',
                      }}
                    >
                      Welcome to Fatoura, {greetingName}.
                    </h1>
                    <p
                      style={{
                        color: '#e5e7e8',
                        fontSize: '16px',
                        lineHeight: 1.6,
                        margin: '14px 0 0',
                        maxWidth: '460px',
                      }}
                    >
                      A clearer way to manage your invoices, clients, and payments starts here.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '28px' }}>
                    <p
                      style={{
                        color: '#41474b',
                        fontSize: '15px',
                        lineHeight: 1.65,
                        margin: '0',
                      }}
                    >
                      Start by adding your business details. Then add a client and create your first
                      invoice when you are ready.
                    </p>

                    <table
                      role="presentation"
                      cellPadding={0}
                      cellSpacing={0}
                      border={0}
                      style={{
                        borderTop: '1px solid #e5e7eb',
                        marginTop: '28px',
                        width: '100%',
                      }}
                    >
                      <tbody>
                        <tr>
                          <td style={{ padding: '20px 0 0' }}>
                            <h2
                              style={{
                                color: '#303538',
                                fontSize: '17px',
                                lineHeight: 1.4,
                                margin: '0 0 14px',
                              }}
                            >
                              A simple place to start
                            </h2>
                            <table
                              role="presentation"
                              cellPadding={0}
                              cellSpacing={0}
                              border={0}
                              style={{ width: '100%' }}
                            >
                              <tbody>
                                {[
                                  {
                                    title: 'Add your business details',
                                    description: 'Make sure your invoices show the right information.',
                                  },
                                  {
                                    title: 'Add a client',
                                    description: 'Keep the details you need to bill them together.',
                                  },
                                  {
                                    title: 'Create your first invoice',
                                    description: 'Add line items, review the total, and send it when ready.',
                                  },
                                ].map((step, index) => (
                                  <tr key={step.title}>
                                    <td
                                      align="center"
                                      valign="top"
                                      style={{
                                        color: '#d9612b',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        lineHeight: '22px',
                                        padding: index === 0 ? '0 12px 14px 0' : '14px 12px 14px 0',
                                        width: '24px',
                                      }}
                                    >
                                      {index + 1}
                                    </td>
                                    <td
                                      style={{
                                        padding: index === 0 ? '0 0 14px' : '14px 0',
                                        borderTop: index === 0 ? 'none' : '1px solid #eef0f2',
                                      }}
                                    >
                                      <p
                                        style={{
                                          color: '#303538',
                                          fontSize: '14px',
                                          fontWeight: 700,
                                          lineHeight: 1.4,
                                          margin: '0',
                                        }}
                                      >
                                        {step.title}
                                      </p>
                                      <p
                                        style={{
                                          color: '#626b71',
                                          fontSize: '13px',
                                          lineHeight: 1.55,
                                          margin: '4px 0 0',
                                        }}
                                      >
                                        {step.description}
                                      </p>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      backgroundColor: '#f8f8f9',
                      borderTop: '1px solid #e5e7eb',
                      padding: '20px 28px',
                    }}
                  >
                    <p
                      style={{
                        color: '#626b71',
                        fontSize: '12px',
                        lineHeight: 1.6,
                        margin: '0',
                      }}
                    >
                      You are receiving this email because you created a Fatoura account.
                      <br />
                      Fatoura — Put your business on every invoice.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}