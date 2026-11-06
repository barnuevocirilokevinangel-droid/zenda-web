import { Link } from 'react-router-dom';
import usePageMeta from '../../lib/usePageMeta.js';
import LegalLayout, { ContactList, LegalList, LegalSection, ProviderIdentity } from './LegalLayout.jsx';

export default function Privacy() {
  usePageMeta({ title: 'Política de Privacidad y Tratamiento de Datos | Zenda' });

  return (
    <LegalLayout
      eyebrow="Legal"
      title="Política de Privacidad y Tratamiento de Datos"
      intro="En Zenda garantizamos la confidencialidad, integridad y seguridad de la información personal y corporativa que nos confías al interactuar con nuestra plataforma wearezenda.com, nuestros formularios de diagnóstico y el portal interactivo de onboarding."
    >
      <LegalSection title="1. Responsable del tratamiento de datos">
        <p>
          El responsable del banco de datos personales y de la información recopilada en{' '}
          <a
            href="https://wearezenda.com"
            className="font-medium text-zenda-dark underline underline-offset-4 hover:text-zenda-blue"
          >
            wearezenda.com
          </a>{' '}
          es <ProviderIdentity /> (en adelante, “Zenda”). Damos estricto cumplimiento a la Ley N° 29733,
          Ley de Protección de Datos Personales del Perú, su Reglamento y estándares internacionales de
          seguridad de la información.
        </p>
      </LegalSection>

      <LegalSection title="2. Datos recopilados y métodos de captura">
        <p>Recopilamos únicamente los datos necesarios para la evaluación y prestación de servicios:</p>
        <LegalList
          items={[
            'Diagnóstico en 60 segundos (landing principal): nombre completo, nombre del negocio o marca, industria o rubro, número telefónico / WhatsApp, cuello de botella operativo prioritario y presupuesto estimado.',
            'Portal interactivo de Onboarding (/onboarding): razón social o nombre comercial, RUC (opcional), nombres y cargo del decisor, teléfono/correo de contacto, perfiles de redes sociales y web, enlace a carpeta de Drive con recursos de marca, producto estrella, ticket promedio, volumen semanal, canal principal de atención, herramientas en uso, cuellos de botella y metas a 90 días.',
            'Libro de Reclamaciones: información de identidad, domicilio, correo y fundamentación del reclamo o queja según lo normado por INDECOPI.',
            'Comunicaciones directas: registros de mensajes cursados vía WhatsApp Business o correo electrónico para la gestión de proyectos.',
            'Datos técnicos de navegación: registros de acceso anónimos (IP anonimizada, navegador, resolución de pantalla) recolectados con fines de telemetría y seguridad de red.',
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Finalidad del tratamiento">
        <LegalList
          items={[
            'Auditar la situación operativa y tecnológica de tu negocio para elaborar propuestas y planes de acción a medida.',
            'Configurar, desplegar y mantener los sistemas de software, integraciones con WhatsApp, bases de datos y flujos de automatización contratados.',
            'Establecer contacto fluido y ágil para el seguimiento de entregables, soporte técnico y coordinación de reuniones de avance.',
            'Cumplir con las obligaciones legales, tributarias y contractuales derivadas de la relación comercial.',
            'Enviar comunicaciones informativas sobre mejoras tecnológicas o metodológicas, siempre con la opción de darse de baja en cualquier momento.',
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Principio de confidencialidad y no cesión">
        <p>
          Zenda <strong>bajo ninguna circunstancia vende, alquila ni comercializa</strong> tus datos
          personales, bases de prospectos o información de tu negocio con terceras empresas para fines
          publicitarios o comerciales ajenos a nuestra operación.
        </p>
      </LegalSection>

      <LegalSection title="5. Encargados del tratamiento y transferencia internacional">
        <p>
          Para garantizar la alta disponibilidad, rendimiento y seguridad de nuestras soluciones,
          trabajamos con infraestructura en la nube de nivel corporativo que puede almacenar datos en
          servidores internacionales:
        </p>
        <LegalList
          items={[
            'Google Cloud Platform / Cloud Firestore: base de datos segura y encriptada para el almacenamiento de registros y onboarding.',
            'Meta Platforms Ireland Ltd. / WhatsApp Business: infraestructura de canalización de mensajería y notificaciones operativas.',
            'Vercel Inc.: red de distribución de contenido (CDN) y servidores de borde para la entrega web optimizada.',
          ]}
        />
        <p>
          Todos nuestros proveedores cumplen con estrictos protocolos de encriptación en tránsito (TLS 1.3)
          y en reposo (AES-256).
        </p>
      </LegalSection>

      <LegalSection title="6. Ejercicio de derechos ARCO">
        <p>
          Como titular de los datos personales tienes derecho a acceder, rectificar, cancelar u oponerte
          al tratamiento de tu información (Derechos ARCO), así como a revocar tu consentimiento en
          cualquier momento.
        </p>
        <p>
          Para ejercer cualquiera de estos derechos, basta con enviar una solicitud indicando tu nombre
          completo, el número de documento de identidad y el detalle de tu petición a nuestro canal
          oficial de atención por correo o WhatsApp. Responderemos en los plazos legalmente fijados por la
          normativa peruana.
        </p>
      </LegalSection>

      <LegalSection title="7. Seguridad y retención de la información">
        <p>
          Conservamos la información recopilada mientras exista una relación comercial activa o el plazo
          exigido por normas tributarias y de auditoría contable. Concluido dicho periodo, los datos se
          eliminan o anonimizan de forma segura mediante protocolos de borrado criptográfico.
        </p>
      </LegalSection>

      <LegalSection title="8. Términos asociados y canales oficiales">
        <p>
          Para conocer el marco contractual y operativo completo de nuestros servicios, consulta también nuestros{' '}
          <Link to="/terminos" className="font-medium text-zenda-dark underline underline-offset-4 hover:text-zenda-blue">
            Términos y Condiciones
          </Link>
          .
        </p>
        <ContactList />
      </LegalSection>
    </LegalLayout>
  );
}
