export const emailTemplate = `<table width="620" cellspacing="0" cellpadding="0" border="0" align="center">
  <tbody>
    <tr>
      <td bgcolor="#F5F5F5">
        <table width="578" cellspacing="0" cellpadding="0" border="0" align="center">
          <tbody>
            <tr>
              <td height="16"></td>
            </tr>
            <tr>
              <td>
                <img
                  src="https://toodl.yendric.be/logo192.png"
                  height="80"
                  style="
                    margin: auto;
                    display: block;
                    height: 80px;
                    width: auto;
                    box-shadow: 4px 6px 26px 2px rgba(0, 0, 0, 0.15);
                    border-radius: 15px;
                  "
                />
              </td>
            </tr>
            <tr>
              <td height="16"></td>
            </tr>
            <tr>
              <td
                align="left"
                bgcolor="#FFFFFF"
                style="box-shadow: 4px 6px 26px 2px rgba(0, 0, 0, 0.03); border-radius: 8px"
              >
                <table width="578" cellspacing="0" cellpadding="0" border="0" align="center">
                  <tbody>
                    <tr>
                      <td height="22" colspan="3"></td>
                    </tr>
                    <tr>
                      <td width="40"></td>
                      <td width="498">
                        <div style="font-family: arial, Arial, sans-serif; color: gray">
                          <p>Beste {voornaam}</p>
                          <p>{tekst}</p>
                          <ul>
                            {todoHTML}
                          </ul>
                        </div>
                      </td>
                      <td width="40"></td>
                    </tr>
                    <tr>
                      <td height="22" colspan="3"></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td height="16"></td>
            </tr>
            <tr>
              <td align="center">
                <table cellspacing="0" cellpadding="0" border="0" align="center">
                  <tbody>
                    <tr>
                      <td width="40"></td>
                      <td width="498">
                        <div
                          style="
                            font-family: arial, Arial, sans-serif;
                            font-size: 11px;
                            color: #999999;
                            line-height: 14px;
                          "
                        >
                          <a
                            href="https://toodl.yendric.be"
                            style="text-decoration: none; color: #1c62b9"
                            target="_blank"
                            >Toodl</a
                          >
                          ???
                          <a
                            href="https://toodl.yendric.be/profile/settings#notifications"
                            style="text-decoration: none; color: #1c62b9"
                            target="_blank"
                            >Notificatie instellingen aanpassen</a
                          >
                        </div>
                      </td>
                      <td width="40"></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td height="16"></td>
            </tr>
            <tr>
              <td align="left">
                <table cellspacing="0" cellpadding="0" border="0" align="center">
                  <tbody>
                    <tr>
                      <td width="40"></td>
                      <td width="498">
                        <div
                          style="
                            font-family: arial, Arial, sans-serif;
                            font-size: 11px;
                            color: #999999;
                            line-height: 13px;
                          "
                        >
                          ??2020 <span class="il">Toodl</span>, toodl@yendric.be
                        </div>
                      </td>
                      <td width="40"></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td height="22"></td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
`;
