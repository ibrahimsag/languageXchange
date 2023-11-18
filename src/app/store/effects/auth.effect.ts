import { Injectable } from '@angular/core';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  catchError,
  map,
  of,
  switchMap,
  tap,
  forkJoin,
  combineLatest,
} from 'rxjs';

import { AuthService } from 'src/app/services/auth/auth.service';
import { Account } from 'src/app/models/Account';
import { ErrorInterface } from 'src/app/models/types/errors/error.interface';
import { UserService } from 'src/app/services/user/user.service';
import { User } from 'src/app/models/User';
import { LanguageService } from 'src/app/services/user/language.service';
import { Language } from 'src/app/models/Language';
import { AddLanguageRequestInterface } from 'src/app/models/types/requests/addLanguageRequest.interface';
import { isLoggedInResponseInterface } from 'src/app/models/types/responses/isLoggedInResponse.interface';
import {
  completeRegistrationAction,
  completeRegistrationFailureAction,
  completeRegistrationSuccessAction,
  isLoggedInAction,
  isLoggedInFailureAction,
  isLoggedInSuccessAction,
  languageSelectionAction,
  languageSelectionFailureAction,
  languageSelectionSuccessAction,
  loginAction,
  loginFailureAction,
  loginSuccessAction,
  logoutAction,
  logoutFailureAction,
  logoutSuccessAction,
  registerAction,
  registerFailureAction,
  registerSuccessAction,
  updateLanguageArrayAction,
  updateLanguageArrayFailureAction,
  updateLanguageArraySuccessAction,
} from 'src/app/store/actions/auth.action';
import {
  getProfileAction,
  getProfileFailureAction,
  getProfileSuccessAction,
} from 'src/app/store/actions/profile.action';

@Injectable()
export class AuthEffect {
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginAction),
      switchMap(({ request }) =>
        this.authService.login(request).pipe(
          map((payload: Account) => loginSuccessAction({ payload })),

          catchError((errorResponse: HttpErrorResponse) => {
            const error: ErrorInterface = {
              message: errorResponse.message,
            };
            return of(loginFailureAction({ error }));
          })
        )
      )
    )
  );

  redirectAfterLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginSuccessAction),
        tap(() => {
          this.router.navigateByUrl('/home');
        })
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(registerAction),
      switchMap(({ request }) =>
        this.authService.register(request).pipe(
          map((payload: Account) => registerSuccessAction({ payload })),

          catchError((errorResponse: HttpErrorResponse) => {
            const error: ErrorInterface = {
              message: errorResponse.message,
            };
            return of(registerFailureAction({ error }));
          })
        )
      )
    )
  );

  redirectAfterRegister$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(registerSuccessAction),
        tap(() => {
          this.router.navigateByUrl('/login/signup/complete');
        })
      ),
    { dispatch: false }
  );

  completeRegistration$ = createEffect(() =>
    this.actions$.pipe(
      ofType(completeRegistrationAction),
      switchMap(({ request, id }) => {
        return this.userService.createUserDoc(id, request).pipe(
          map((payload: User) =>
            completeRegistrationSuccessAction({ payload })
          ),

          catchError((errorResponse: HttpErrorResponse) => {
            const error: ErrorInterface = {
              message: errorResponse.message,
            };
            return of(completeRegistrationFailureAction({ error }));
          })
        );
      })
    )
  );

  redirectAfterCompleteRegistration$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(completeRegistrationSuccessAction),
        tap(() => {
          this.router.navigateByUrl('/login/signup/language');
        })
      ),
    { dispatch: false }
  );

  languageSelection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(languageSelectionAction),

      switchMap(({ request }) => {
        const observables = request.map(
          (language: AddLanguageRequestInterface) => {
            return this.languageService.createLanguageDoc2(language);
          }
        );
        return forkJoin(observables).pipe(
          map((payload: Language[]) =>
            languageSelectionSuccessAction({ payload })
          ),

          catchError((errorResponse: HttpErrorResponse) => {
            const error: ErrorInterface = {
              message: errorResponse.message,
            };
            return of(languageSelectionFailureAction({ error }));
          })
        );
      })
    )
  );

  updateLanguageArray$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateLanguageArrayAction),

      switchMap(({ request, id }) => {
        return this.userService
          .updateUserDoc2(id, {
            languageArray: request,
          })
          .pipe(
            map((payload: User) =>
              updateLanguageArraySuccessAction({ payload })
            ),

            catchError((errorResponse: HttpErrorResponse) => {
              const error: ErrorInterface = {
                message: errorResponse.message,
              };
              return of(updateLanguageArrayFailureAction({ error }));
            })
          );
      })
    )
  );

  redirectAfterBothLanguageSelectionAndUpdateLanguageArray$ = createEffect(
    () =>
      combineLatest([
        this.actions$.pipe(ofType(languageSelectionSuccessAction)),
        this.actions$.pipe(ofType(updateLanguageArraySuccessAction)),
      ]).pipe(
        tap(() => {
          this.router.navigateByUrl('/home');
        })
      ),
    { dispatch: false }
  );

  isLoggedIn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(isLoggedInAction),
      switchMap(() => {
        return this.authService.getAccount().pipe(
          switchMap((account: Account) => {
            return this.userService.getUserDoc2(account.$id).pipe(
              map((currentUser: User) => {
                const payload: isLoggedInResponseInterface = {
                  account: account,
                  currentUser: currentUser,
                };
                return isLoggedInSuccessAction({ payload });
              }),
              catchError(() => {
                const error: ErrorInterface = {
                  message:
                    'Registration is not completed yet. Please try again.',
                };
                return of(isLoggedInFailureAction({ error }));
              })
            );
          }),
          catchError(() => {
            const error: ErrorInterface = {
              message: 'Please login or signup to continue.',
            };
            return of(isLoggedInFailureAction({ error }));
          })
        );
      })
    )
  );

  getProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getProfileAction),
      switchMap(({ userId }) => {
        return this.userService.getUserDoc2(userId).pipe(
          map((payload: User) => getProfileSuccessAction({ payload })),

          catchError((errorResponse: HttpErrorResponse) => {
            const error: ErrorInterface = {
              message: errorResponse.message,
            };
            return of(getProfileFailureAction({ error }));
          })
        );
      })
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logoutAction),
      switchMap(() => {
        return this.authService.logout().pipe(
          map(() => {
            return logoutSuccessAction({ payload: null });
          }),
          catchError((errorResponse: HttpErrorResponse) => {
            const error: ErrorInterface = {
              message: errorResponse.message,
            };
            return of(logoutFailureAction({ error }));
          })
        );
      })
    )
  );

  redirectAfterLogout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logoutSuccessAction),
        tap(() => {
          this.router.navigateByUrl('/login', { replaceUrl: true });
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private userService: UserService,
    private languageService: LanguageService,
    private router: Router
  ) {}
}
