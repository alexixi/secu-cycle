// Lien sortant, avec les attributs de sécurité qui vont avec.
//
// Sert surtout de composant de substitution pour <Trans> : les URL restent dans
// le JSX, le catalogue ne porte que le texte et ses ancres. Un traducteur n'a
// donc jamais à recopier une adresse — ni à risquer de la casser.
export default function ExternalLink({ href, children }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    );
}
