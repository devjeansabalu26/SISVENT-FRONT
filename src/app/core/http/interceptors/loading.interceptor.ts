import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../loading/loading.service';
import { SKIP_GLOBAL_LOADING } from '../../loading/loading-context.token';

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(SKIP_GLOBAL_LOADING)) {
    return next(request);
  }

  const loading = inject(LoadingService);
  loading.begin();
  return next(request).pipe(finalize(() => loading.end()));
};
