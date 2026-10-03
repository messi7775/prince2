import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ChangePasswordInput } from '@prince-net/validation';
import { changePassword } from '../api/change-password';

/**
 * useChangePassword — mutation لتغيير كلمة المرور.
 *
 * ⚠️ بعد نجاح العملية:
 *  - Backend يمسح HttpOnly Cookie الحالي.
 *  - لا نستدعي POST /auth/logout (لأن الجلسة انتهت بالفعل).
 *  - نمسح query cache + ننتقل إلى /login.
 */
export function useChangePassword() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input),
    onSuccess: () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
}