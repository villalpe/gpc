export type HttpErrorUX = {
  message: string;
  redirectTo?: string;
};

export function mapHttpStatusToUX(status: number, nextPath?: string): HttpErrorUX {
  if (status === 401) {
    const redirectTo = nextPath
      ? `/login?next=${encodeURIComponent(nextPath)}`
      : "/login";
    return {
      message: "Tu sesión expiró. Inicia sesión nuevamente.",
      redirectTo,
    };
  }

  if (status === 403) {
    return {
      message: "No autorizado para esta acción.",
    };
  }

  return {
    message: "Ocurrió un error inesperado. Intenta nuevamente.",
  };
}