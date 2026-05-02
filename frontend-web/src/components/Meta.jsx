import { Helmet } from 'react-helmet-async';

export default function Meta({ title, description, name = "Sécu'Cycle", noindex = false }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name='description' content={description} />
      {noindex && <meta name='robots' content='noindex' />}

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={name} />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
