"use client";

import { useTranslations } from "next-intl";
import { uploadProfilePhoto } from "@/lib/actions/profile-photos";
import { SubmitPhotoButton } from "@/components/profile/SubmitPhotoButton";

type Props = {
  profileId: string;
  locale: string;
  isTransporteur: boolean;
};

export function ProfilePhotoForms({ profileId, locale, isTransporteur }: Props) {
  const t = useTranslations("profile");

  return (
    <div className="mt-6 space-y-6 border-t border-[var(--border)] pt-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("avatarHeading")}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{t("avatarHint")}</p>
        <form
          action={uploadProfilePhoto}
          encType="multipart/form-data"
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="profile_user_id" value={profileId} />
          <input type="hidden" name="kind" value="avatar" />
          <input
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="max-w-full text-sm text-[var(--text-primary)] file:me-3 file:rounded-lg file:border-0 file:bg-[var(--surface-muted)] file:px-3 file:py-2 file:text-[var(--text-primary)]"
          />
          <SubmitPhotoButton label={t("uploadAvatar")} pendingLabel={t("uploading")} />
        </form>
      </div>

      {isTransporteur ? (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("transportPhotoHeading")}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{t("transportPhotoHint")}</p>
          <form
            action={uploadProfilePhoto}
            encType="multipart/form-data"
            className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="profile_user_id" value={profileId} />
            <input type="hidden" name="kind" value="transport" />
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="max-w-full text-sm text-[var(--text-primary)] file:me-3 file:rounded-lg file:border-0 file:bg-[var(--surface-muted)] file:px-3 file:py-2 file:text-[var(--text-primary)]"
            />
            <SubmitPhotoButton label={t("uploadTransportPhoto")} pendingLabel={t("uploading")} />
          </form>
        </div>
      ) : null}
    </div>
  );
}
