import Messagerie from '../avocate/Messagerie';

export default function MessagerieStagiaire() {
  return (
    <Messagerie
      contactRoles={['AVOCAT', 'SECRETAIRE']}
      pageTitle="Messagerie"
      pageSubtitle="Communiquez avec votre avocat superviseur et la secrétaire"
    />
  );
}
