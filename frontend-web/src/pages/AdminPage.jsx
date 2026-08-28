import { useTranslation } from "react-i18next";
import Meta from "../components/Meta";

export default function AdminPage() {
  const { t } = useTranslation('auth');
  return (
    <>
      <Meta title={t('admin.titrePage')} description={t('admin.metaDescription')} noindex />
      <div>
        <h1>{t('admin.h1')}</h1>
        <p>{t('admin.intro')}</p>
      </div>
    </>
  )
}
