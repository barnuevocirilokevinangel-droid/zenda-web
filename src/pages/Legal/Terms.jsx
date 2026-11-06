import { Link } from 'react-router-dom';
import usePageMeta from '../../lib/usePageMeta.js';
import LegalLayout, { ContactList, LegalList, LegalSection, ProviderIdentity } from './LegalLayout.jsx';

export default function Terms() {
  usePageMeta({ title: 'Términos y Condiciones de Servicio | Zenda' });

  return (
    <LegalLayout
      eyebrow="Legal"
      title="Términos y Condiciones de Servicio"
      intro="Estos términos regulan el uso del sitio web oficial wearezenda.com y la contratación de los servicios de ingeniería de software, automatizaciones operativas y marketing digital prestados por Zenda. Léelos con atención antes de utilizar nuestros servicios."
    >
      <LegalSection title="1. Quiénes somos y aceptación de los términos">
        <p>
          Los servicios son prestados por <ProviderIdentity /> operando bajo la marca comercial{' '}
          <strong>Zenda</strong> en el dominio oficial{' '}
          <a
            href="https://wearezenda.com"
            className="font-medium text-zenda-dark underline underline-offset-4 hover:text-zenda-blue"
          >
            wearezenda.com
          </a>
          . Al navegar por nuestro sitio, completar formularios de diagnóstico, acceder al portal de
          onboarding o contratar nuestros servicios, declaras ser mayor de edad y aceptas en su totalidad
          estos Términos y nuestra{' '}
          <Link to="/privacidad" className="font-medium text-zenda-dark underline underline-offset-4 hover:text-zenda-blue">
            Política de Privacidad
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Alcance de los servicios">
        <p>Zenda ofrece soluciones especializadas en tres ejes estratégicos:</p>
        <LegalList
          items={[
            'Ingeniería de software a medida: diseño y desarrollo de aplicaciones web, portales interactivos, dashboards operativos, sistemas de pedidos, landing pages de alta velocidad y arquitecturas cloud.',
            'Automatizaciones operativas: flujos automatizados de respuesta en WhatsApp, captura y sincronización de prospectos con CRM (Kommo, HubSpot, etc.), alertas en tiempo real y eliminación de tareas manuales repetitivas.',
            'Marketing digital y adquisición: producción audiovisual de alto impacto, dirección creativa, optimización de pauta publicitaria en plataformas digitales y estrategias de conversión.',
            'Auditoría y onboarding de clientes: levantamiento de procesos, diagnóstico de sistemas existentes y definición de la hoja de ruta técnica a 90 días.',
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Propuesta comercial, hitos y entregables">
        <p>
          Cada proyecto formal se estructura mediante una propuesta técnica u orden de servicio aceptada
          por el cliente, en la que se detallan los objetivos, entregables específicos, cronograma estimado,
          inversión y condiciones de pago. Cualquier modificación o solicitud adicional fuera del alcance
          inicial será evaluada y cotizada de forma independiente mediante un anexo o adenda.
        </p>
        <p>
          El cumplimiento de los plazos comprometidos depende directamente de la entrega oportuna por parte
          del cliente de los accesos técnicos, insumos gráficos, credenciales y aprobaciones requeridas.
        </p>
      </LegalSection>

      <LegalSection title="4. Obligaciones y accesos del cliente">
        <LegalList
          items={[
            'Brindar información verídica, actualizada y suficiente respecto a la operativa y titularidad de su negocio.',
            'Facilitar de manera segura los accesos a repositorios, carpetas de recursos (Drive/OneDrive), gestores de anuncios o APIs necesarias para la implementación técnica.',
            'Garantizar que cuenta con los derechos de propiedad intelectual sobre las marcas, fotografías, logotipos y contenidos provistos a Zenda.',
            'Acatar las políticas de uso y normativas de plataformas terceras integradas (Meta Platforms, WhatsApp Business API, Google Cloud, Stripe, proveedores de hosting, etc.).',
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Precios, facturación e inversión publicitaria">
        <p>
          Los honorarios de Zenda se pactan en la propuesta y se facturan de conformidad con la normativa
          tributaria aplicable. Salvo estipulación expresa en contrario, los presupuestos no incluyen el costo
          directo de la pauta publicitaria (ad spend) en redes sociales, licencias de software de terceros,
          dominios o consumo de APIs de pago, los cuales son asumidos directamente por el cliente.
        </p>
        <p>
          El retraso injustificado en los pagos pactados faculta a Zenda para suspender temporalmente el
          desarrollo o soporte de los sistemas hasta la regularización de los saldos correspondientes.
        </p>
      </LegalSection>

      <LegalSection title="6. Propiedad intelectual y licencias de código">
        <p>
          Una vez abonada la totalidad de los honorarios pactados, el cliente adquiere la titularidad de los
          entregables finales diseñados a su medida (diseños gráficos finales, copys y assets audiovisuales
          específicos).
        </p>
        <p>
          Zenda conserva la titularidad moral y patrimonial sobre su código base reutilizable, librerías,
          scripts internos, plantillas de automatización, metodologías y know-how técnico desarrollado con
          anterioridad o de forma independiente, otorgando al cliente una licencia perpetua, no exclusiva y
          transferible para el uso operativo de la solución contratada.
        </p>
      </LegalSection>

      <LegalSection title="7. Confidencialidad y seguridad de la información">
        <p>
          Ambas partes se comprometen a salvaguardar bajo estricto deber de reserva toda información técnica,
          comercial, estratégica o de clientes a la que tengan acceso durante la ejecución de los servicios.
          Zenda no compartirá, comercializará ni utilizará dicha información sensible para fines ajenos al
          proyecto. Zenda se reserva el derecho de exhibir el trabajo realizado en su portafolio comercial de
          wearezenda.com, salvo pacto expreso de confidencialidad en contrario.
        </p>
      </LegalSection>

      <LegalSection title="8. Garantía de software y soporte técnico">
        <p>
          Todo desarrollo de software entregado cuenta con un periodo de garantía de estabilidad técnica
          estipulado en la propuesta (destinado a corregir eventuales fallos de programación o bugs atribuibles al
          código desarrollado). La garantía no cubre alteraciones realizadas por terceros ajenos a Zenda, fallas
          en la infraestructura del proveedor de hosting del cliente o cambios unilaterales en las APIs de terceros.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitación de responsabilidad">
        <p>
          Zenda ejecuta sus servicios bajo estándares rigurosos de ingeniería y buenas prácticas de la industria.
          Sin embargo, los resultados comerciales finales (volumen de ventas, costo por adquisición, retorno de
          inversión publicitaria) están sujetos a variables del mercado, estacionalidad, oferta y conversión del
          producto del cliente. Por ende, Zenda no otorga garantías implícitas de rendimiento económico.
        </p>
        <p>
          La responsabilidad patrimonial total de Zenda por cualquier concepto derivado de estos términos estará
          limitada al importe efectivamente percibido por el servicio en los últimos tres meses previos al hecho
          generador.
        </p>
      </LegalSection>

      <LegalSection title="10. Libro de Reclamaciones">
        <p>
          En estricto cumplimiento del Código de Protección y Defensa del Consumidor de la República del Perú (Ley
          N° 29571), ponemos a disposición de todos nuestros usuarios y clientes nuestro{' '}
          <Link to="/reclamaciones" className="font-medium text-zenda-dark underline underline-offset-4 hover:text-zenda-blue">
            Libro de Reclamaciones Virtual
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Ley aplicable y solución de controversias">
        <p>
          Estos términos se rigen e interpretan bajo las leyes de la República del Perú. Cualquier controversia,
          desavenencia o reclamación que no pueda ser resuelta de mutuo acuerdo en trato directo será sometida a la
          competencia territorial de los juzgados y tribunales de la ciudad de Chimbote, Áncash, Perú.
        </p>
      </LegalSection>

      <LegalSection title="12. Canales oficiales de contacto">
        <ContactList />
      </LegalSection>
    </LegalLayout>
  );
}
