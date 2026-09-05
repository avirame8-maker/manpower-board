# לוח מילואים והצח

אתר Next.js 14 (עברית, RTL) ללוח כוח אדם וכוננויות שמשקף את גיליון Google Sheets
`לוח מילואים והצח`. גרסה ראשונה עובדת מעותק JSON מקומי תחת `data/` — בלי
הרשאות Google ובלי OAuth.

## כניסה

- אימייל ברשימת ההרשאות **או** סיסמה משותפת.
- ברירת מחדל לפריסה: `avirame8@gmail.com` / `aviram`.
- עוגיית סשן חתומה ב-HMAC. כל הנתיבים מוגנים חוץ מ-`/login` וקבצים סטטיים.

## משתני סביבה (Vercel + מקומי)

העתיקו את `.env.example` ל-`.env.local` לפיתוח. בפרודקשן הגדירו ב-Vercel:

| משתנה | ערך |
| --- | --- |
| `ALLOWED_EMAILS` | `avirame8@gmail.com` |
| `PREVIEW_PASSWORD` | `aviram` |
| `SESSION_SECRET` | מחרוזת אקראית ארוכה |
| `SHEETS_SPREADSHEET_ID` | `1f1rfc60-0FNQQOWj_AbEJCuUws6FdAI2gRZTauwoUog` |

יצירת סוד מקומית:

```bash
openssl rand -hex 32
```

## הרצה מקומית

```bash
npm install
cp .env.example .env.local
# ערכו SESSION_SECRET ב-.env.local
npm run dev
```

פתחו [http://localhost:3000](http://localhost:3000) והתחברו.

## גיליונות (15 לשוניות)

כוח אדם · שבוע 17 +18 · מעקב מבחנים חודשיים · לוח אילוצים מילואים והצח ·
ביצוע מבחן · פסח א' + ב' · שבתות1.25 · שבתות 2.25 מעודכן · חישוב ·
שבתות 1.26 · שבתות 2.26 · חגים 2.26 · ניהול 2.26 · טבלת סיכום כוננויות · LOG

תאי כוננות ריקים נפתחים כרשימת שמות. מילוי/ניקוי נשמר דרך
`POST /api/sync/push-cell` לעותק JSON מקומי (וב-Vercel ל-`/tmp`).
כפתור **רענון** קורא ל-`POST /api/sync/pull` וטוען מחדש את העותק המקומי.
סנכרון חי ל-Sheets API עדיין TODO.

העתק הנתונים ב-`data/dump.json` מבוסס על מבנה הגיליון החי. כתובות `@idf.il`
לא נכללו בריפו הציבורי.

## כתובת חיה

פרודקשן על חשבון Vercel `avirame8-1861` (אותו חשבון כמו survival-mode-one):

**https://manpower-board-iota.vercel.app**

כניסה: אימייל `avirame8@gmail.com` או סיסמה `aviram`.

## פריסה

הפרויקט מוגדר ל-Next.js ב-`vercel.json`. אחרי החיבור ל-Vercel:

1. Import של הריפו `avirame8-maker/manpower-board`
2. Framework: Next.js
3. הגדרת ארבעת משתני הסביבה למעלה ב-Production
4. Deploy מ-`main`
