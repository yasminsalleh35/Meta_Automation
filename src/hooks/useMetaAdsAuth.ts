
import { useMetaAdsCredentialValidator } from './useMetaAdsCredentialValidator';
import { useMetaAdsAdvancedPermissions } from './useMetaAdsAdvancedPermissions';
import { useMetaAdsPermissionLevels } from './useMetaAdsPermissionLevels';

export const useMetaAdsAuth = () => {
  const { validateCredentials, isLoading, currentPermissions } = useMetaAdsCredentialValidator();
  const { requestAdvancedPermissions } = useMetaAdsAdvancedPermissions();
  const { permissionLevels } = useMetaAdsPermissionLevels();

  return {
    isLoading,
    currentPermissions,
    permissionLevels,
    validateCredentials,
    requestAdvancedPermissions
  };
};
