import React from 'react';
import { LinkList, LinkListItem } from 'design-react-kit';
import { ACCESSIBILITY_DECLARATION_URL } from '../config';

export default function Footer() {
  return (
    <footer className="it-footer">
      <div className="it-footer-main">
        <div className="container">
          <section>
            <div className="row clearfix">
              <div className="col-sm-12">
                <div className="it-brand-wrapper">
                  <div className="it-brand-text">
                    <h2 className="no_toc">Città di Messina</h2>
                    <h3 className="no_toc d-none d-md-block">Portale Open Data</h3>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="py-4 border-white border-top">
            <div className="row">
              <div className="col-lg-4 col-md-4 pb-2">
                <h4>
                  <a href="#" title="Contatti" className="text-white text-decoration-none">
                    Contatti
                  </a>
                </h4>
                <p className="text-white">
                  <strong>Città di Messina</strong><br />
                  Piazza Unione Europea<br />
                  98122, Messina (ME)
                </p>
                <p className="text-white">
                  Codice Fiscale: 00080270838<br />
                  Partita IVA: 00080270838
                </p>
                <div className="link-list-wrapper">
                  <LinkList className="footer-list clearfix">
                    <LinkListItem 
                      href="mailto:protocollogenerale@comune.messina.it"
                      className="list-item text-white"
                    >
                      E-mail: protocollogenerale@comune.messina.it
                    </LinkListItem>
                    <LinkListItem 
                      href="mailto:protocollo@pec.comune.messina.it"
                      className="list-item text-white"
                    >
                      PEC: protocollo@pec.comune.messina.it
                    </LinkListItem>
                  </LinkList>
                </div>
              </div>
              <div className="col-lg-4 col-md-4 pb-2">
                <h4>
                  <a href="#" title="Informazioni" className="text-white text-decoration-none">
                    Informazioni
                  </a>
                </h4>
                <p className="text-white">
                  Il portale Open Data del Comune di Messina permette di consultare 
                  e scaricare i dati pubblici in formato aperto.
                </p>
                <div className="link-list-wrapper">
                  <LinkList className="footer-list clearfix">
                    <LinkListItem href="tel:+390907721" className="list-item text-white">
                      Centralino: +39 090 7721
                    </LinkListItem>
                  </LinkList>
                </div>
              </div>
              <div className="col-lg-4 col-md-4 pb-2">
                <h4>
                  <a href="#" title="Risorse" className="text-white text-decoration-none">
                    Risorse
                  </a>
                </h4>
                <div className="link-list-wrapper">
                  <LinkList className="footer-list clearfix">
                    <LinkListItem 
                      href="https://www.comune.messina.it"
                      target="_blank"
                      rel="noreferrer"
                      className="list-item text-white"
                    >
                      Sito Istituzionale
                    </LinkListItem>
                    <LinkListItem 
                      href="https://docs.ckan.org/"
                      target="_blank"
                      rel="noreferrer"
                      className="list-item text-white"
                    >
                      Documentazione CKAN
                    </LinkListItem>
                  </LinkList>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      <div className="it-footer-small-prints clearfix">
        <div className="container">
          <ul className="it-footer-small-prints-list list-inline mb-0 d-flex flex-column flex-md-row">
            <li className="list-inline-item">
              <span className="footer-copyright-text">© {new Date().getFullYear()} Comune di Messina</span>
            </li>
            <li className="list-inline-item">
              <a href={ACCESSIBILITY_DECLARATION_URL} target="_blank" rel="noreferrer">
                Dichiarazione di Accessibilità
              </a>
            </li>
            <li className="list-inline-item">
              <a href="#">Privacy Policy</a>
            </li>
            <li className="list-inline-item">
              <a href="#">Note Legali</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
