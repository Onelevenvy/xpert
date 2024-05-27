import { registerLocaleData } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import en from '@angular/common/locales/en'
import localeZhExtra from '@angular/common/locales/extra/zh-Hans'
import zh from '@angular/common/locales/zh'
import localeZh from '@angular/common/locales/zh-Hans'
import { ZhHans as AuthZhHans, ZhHant as AuthZhHant } from '@metad/cloud/auth'
import { ZhHans as IAppZhHans, ZhHant as IAppZhHant } from '@metad/cloud/indicator-market/i18n'
import { zhHans as CoreZhHans, zhHant as CoreZhHant, registerLocaleData as nxRegisterLocaleData } from '@metad/core'
import { ZhHans, ZhHant } from '@metad/ocap-angular/i18n'
import { ZhHans as StoryZhHans, ZhHant as StoryZhHant } from '@metad/story/i18n'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { enUS, zhCN, zhHK } from 'date-fns/locale'
import { Observable, map } from 'rxjs'
import { LanguagesEnum } from '../types'


export const LOCALE_DEFAULT = LanguagesEnum.SimplifiedChinese
registerLocaleData(localeZh, LOCALE_DEFAULT, localeZhExtra)
registerLocaleData(zh)
registerLocaleData(en)
nxRegisterLocaleData(CoreZhHans, LanguagesEnum.SimplifiedChinese)
nxRegisterLocaleData(CoreZhHant, LanguagesEnum.TraditionalChinese)

class CustomTranslateHttpLoader extends TranslateHttpLoader {
  getTranslation(lang: string): Observable<Object> {
    let ocapTranslates = {}
    switch (lang) {
      case LanguagesEnum.Chinese:
      case LanguagesEnum.SimplifiedChinese:
        ocapTranslates = {
          ...ZhHans,
          ...CoreZhHans,
          ...StoryZhHans,
          ...AuthZhHans,
          ...IAppZhHans
        }
        break
      case LanguagesEnum.TraditionalChinese:
        ocapTranslates = {
          ...ZhHant,
          ...CoreZhHant,
          ...StoryZhHant,
          ...AuthZhHant,
          ...IAppZhHant
        }
        break
      default:
    }
    return super.getTranslation(lang).pipe(
      map((t) => ({
        ...t,
        ...ocapTranslates
      }))
    )
  }
}

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new CustomTranslateHttpLoader(http, `./assets/i18n/`, '.json')
}

export function mapDateLocale(locale: string) {
  switch (locale) {
    case 'zh-CN':
    case 'zh-Hans':
    case 'zh':
      return zhCN
    case 'zh-Hant':
      return zhHK
    default:
      return enUS
  }
}