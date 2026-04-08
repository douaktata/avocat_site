import Messagerie from '../avocate/Messagerie';

export default function MessagerieClient() {
  return (
    <Messagerie
      contactRoles={['AVOCAT', 'SECRETAIRE']}
      pageTitle="Messagerie"
      pageSubtitle="Communiquez avec votre avocat et la secrétaire"
    />
  );
}
