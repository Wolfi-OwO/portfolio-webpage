// German message catalog. English lives as the `defaultMessage` on each
// <FormattedMessage> / formatMessage() call, so it never needs duplicating here.
export default {
    'nav.projects': 'Projekte',
    'nav.admin': 'Admin',
    'nav.logout': 'Abmelden',
    'nav.services': 'Leistungen',
    'nav.secret': 'Ein neues Geheimnis?!',

    'theme.label': 'Design',
    'theme.light': 'Hell',
    'theme.dark': 'Dunkel',
    'theme.system': 'Browser',

    'language.label': 'Sprache',
    'language.en': 'English',
    'language.de': 'Deutsch',

    'status.source.metrion': 'über Metrion',
    'status.uptime.noData': 'keine Daten',
    'status.metrion.noDetail':
        'Metrion liefert nur Verfügbarkeitsdaten — für diesen Dienst gibt es keine Fehlerdetails.',
    'status.footer.sources':
        'Die Statuswerte stammen aus zwei Quellen: den eigenen Prüfungen dieser Seite und der Verfügbarkeit von Metrion.',

    // Task 16: the date-range picker.
    'status.range.live': 'Aktuell',
    'status.range.24h': '24 Std.',
    'status.range.7d': '7 Tage',
    'status.range.30d': '30 Tage',
    'status.range.90d': '90 Tage',
    'status.range.1y': '1 Jahr',
    'status.range.all': 'Gesamter Zeitraum',
    'status.range.custom': 'Benutzerdefiniert…',
    'status.range.from': 'Von',
    'status.range.to': 'Bis',
    'status.range.apply': 'Anwenden',
    'status.range.error.required': 'Dieses Datum ist erforderlich.',
    'status.range.error.tooEarly': 'Das Datum darf nicht vor dem 1. Januar 2000 liegen.',
    'status.range.error.future': 'Das Datum darf nicht in der Zukunft liegen.',
    'status.range.error.order': 'Das Enddatum muss auf oder nach dem Startdatum liegen.',
    'status.range.error.invalid':
        'Dieser Zeitraum konnte nicht geladen werden — bitte einen anderen wählen.',
    'status.range.unsupported':
        'Zeiträume benötigen die Metrion-Quelle — es wird stattdessen die Standardansicht gezeigt.',
    'status.range.periodLabel': 'Zeitraum',
    'status.range.avgUptimeLabel': 'Ø Verfügbarkeit · Zeitraum',
    'status.range.latencyLabel': 'Latenz · p50 (Zeitraum)',
    'status.range.periodLatencyBoth': '{p50}ms p50 · {p95}ms p95 in diesem Zeitraum',
    'status.range.periodLatencyP50': '{p50}ms p50 in diesem Zeitraum',
    'status.incidents.heading': 'Vorfälle in diesem Zeitraum',
    'status.incidents.ongoing': 'andauernd',
    'status.incidents.more': '+{count} weitere',
    'status.incidents.collapse': 'weniger anzeigen',
    'status.incidents.loadedOfTotal': 'zeigt {loaded} von {total}',
    'status.incidents.viewAll': 'gesamte Vorfallshistorie ansehen',
    'status.incidents.navLink': 'Vorfälle',
    'status.incidents.pageTitle': 'Vorfälle',
    'status.incidents.ongoingHeading': 'Andauernd',
    'status.incidents.empty': 'Keine Vorfälle in diesem Zeitraum.',
    'status.incidents.loadError': 'Vorfälle konnten nicht geladen werden',
    'status.incidents.loading': 'Wird geladen…',
    'status.incidents.backToStatus': 'Zurück zum Status',
    'status.stale.note':
        'Zeigt die zuletzt bekannten Daten — die Live-Quelle hat sich seit {since} nicht mehr gemeldet.',

    'footer.status': 'Status',
    'footer.privacyPolicy': 'Datenschutz',
    'footer.imprint': 'Impressum',
    'footer.contact': 'Kontakt',
    'footer.rightsReserved': 'Alle Rechte vorbehalten.',

    'homepage.role': 'Fullstack-Entwickler / Kärnten, Österreich',
    'homepage.bio':
        'Ich bin Softwareentwickler aus Kärnten. 2026 habe ich die HTL Villach mit Reife- und Diplomprüfung im Bereich Informatik abgeschlossen, und bei Infineon Technologies habe ich Praktika als Softwareentwickler gemacht. Ich arbeite an Webanwendungen, an Apps im Allgemeinen — darunter Android und Desktop — und an Projekten aus Data Science und KI. Mehr zu meinem Werdegang auf <link>LinkedIn</link>.',
    'homepage.technologies': 'Technologien, die ich nutze:',

    'availability.badge.openToWork': 'Offen für Arbeit',
    'availability.badge.openForCommissions': 'Offen für Aufträge',
    'availability.badge.notAvailable': 'Nicht verfügbar',
    'availability.heading': 'Verfügbarkeit',
    'availability.intro':
        'Ich bin offen für Arbeit, will aber beim Zeitplan ehrlich sein: Bis Ende September bin ich im Praktikum, ab Oktober leiste ich meine sechs Monate beim Bundesheer. Kleinere Freelance-Aufträge gehen nebenher — alles Größere startet realistisch im April 2027.',
    'availability.servicesButton': 'Was ich baue und was es kostet',
    'availability.new': 'Neuer Eintrag',
    'availability.form.new': 'Neuer Eintrag',
    'availability.form.edit': 'Eintrag bearbeiten',
    'availability.error.required': 'Titel und Startdatum sind erforderlich.',
    'availability.error.dateOrder': 'Das Enddatum darf nicht vor dem Startdatum liegen.',
    'availability.today': 'heute',
    'availability.now': 'jetzt',
    'availability.openEnded': 'offen',
    'availability.weeks': '{count, plural, one {# Woche} other {# Wochen}}',
    'availability.months': '{count, plural, one {# Monat} other {# Monate}}',
    'availability.kind.work': 'Arbeit',
    'availability.kind.military': 'Bundesheer',
    'availability.kind.education': 'Ausbildung',
    'availability.kind.available': 'Verfügbar',
    'availability.kind.unavailable': 'Nicht verfügbar',

    'career.heading': 'Werdegang & Ausbildung',
    'career.error': 'Werdegang konnte gerade nicht geladen werden.',
    'career.loading': 'lädt…',
    'career.empty': 'Noch nichts veröffentlicht.',
    'career.kind.work': 'Arbeit',
    'career.kind.education': 'Ausbildung',
    'career.new': 'Neuer Eintrag',
    'career.form.new': 'Neuer Eintrag',
    'career.form.edit': 'Eintrag bearbeiten',
    'career.error.required': 'Titel und Startdatum sind erforderlich.',
    'career.error.dateOrder': 'Das Enddatum darf nicht vor dem Startdatum liegen.',

    'activity.heading': 'Woran ich gerade baue',
    'activity.total': '{count} Beiträge seit {since}',
    'activity.loading': 'lädt…',
    'activity.scrollHint': '← scrollen für frühere Jahre',
    'activity.startReached': 'Anfang der Historie',
    'activity.contributions': '{count} Beiträge',
    'activity.unavailable': 'nicht verbunden',
    'activity.recent': 'Zuletzt bearbeitet',
    'activity.less': 'weniger',
    'activity.more': 'mehr',
    'activity.source.all': 'Alle',
    'activity.source.github': 'GitHub',
    'activity.source.gitlab': 'GitLab',

    'services.label': 'Was ich baue',
    'services.title': 'Leistungen',
    'services.intro':
        'Websites, Webanwendungen, Android-Apps in Kotlin und Desktop-Oberflächen mit JavaFX oder .NET. Die Preise unten sind Startpunkte, keine Angebote — was ein Projekt wirklich kostet, hängt davon ab, was es können muss. Das sage ich dir lieber ehrlich nach einem Gespräch, als so zu tun, als wüsste es eine Zahl auf einer Seite.',
    'services.hourlyRate': 'Stundensatz: {rate} € / h',
    'services.priceFrom': 'ab {price} €',
    'services.byTheHour': '{rate} € / h',
    'services.new': 'Neue Leistung',
    'services.error.required': 'Titel und Beschreibung sind erforderlich.',
    'services.form.edit': 'Leistung bearbeiten',
    'services.form.new': 'Neue Leistung',
    'services.category.web': 'Web',
    'services.category.mobile': 'Mobile',
    'services.category.desktop': 'Desktop',
    'services.category.other': 'Sonstiges',
    'services.cta.title': 'Nicht sicher, was davon du brauchst?',
    'services.cta.text':
        'Beschreib mir, was passieren soll, und ich sage dir, was es braucht, um es zu bauen — auch dann, wenn es sich nicht lohnt. Beachte: Bis Ende September bin ich im Praktikum und danach bis April 2027 beim Bundesheer, größere Projekte starten also realistisch danach. Kleinere Arbeiten dazwischen sind möglich.',
    'services.cta.button': 'Kontakt aufnehmen',

    'contact.title': 'Kontakt aufnehmen',
    'contact.description':
        'Freelance-Projekte, Zusammenarbeit oder eine Frage zu meinen Projekten. Wähle den Kanal, der für dich passt. Ich antworte normalerweise innerhalb von ein bis zwei Tagen.',

    'contact.noteEmail': 'Am besten für Projektanfragen. Ich lese meine E-Mails täglich.',
    'contact.noteGithub': 'Alles, was ich öffentlich entwickle.',
    'contact.noteLinkedin': 'Beruflicher Werdegang und Erfahrungen.',
    'contact.noteDiscord': 'Am schnellsten für kurze Fragen. Zum Kopieren klicken.',

    'contact.copied': 'In die Zwischenablage kopiert',

    'contact.replyTime': 'Antwortzeit',
    'contact.location': 'Standort',
    'contact.availability': 'Verfügbarkeit',

    'privacy.label': 'Rechtliches',
    'privacy.title': 'Datenschutzerklärung',
    'privacy.updated': 'Zuletzt aktualisiert: {date}',
    'privacy.intro':
        'Ich habe diese Seite selbst gebaut und ich betreibe sie selbst — deshalb kann ich dir genau sagen, was hier mit deinen Daten passiert: so wenig wie möglich. Es gibt keine Analyse-Tools, kein Tracking, keine Werbung und kein Cookie-Banner, weil es schlicht nichts gibt, worin du einwilligen müsstest. Was trotzdem verarbeitet wird, warum, und auf welcher Rechtsgrundlage, erkläre ich dir hier Abschnitt für Abschnitt.',

    'privacy.controller.title': 'Wer verantwortlich ist',
    'privacy.controller.text':
        'Ich bin der Verantwortliche für die Datenverarbeitung auf dieser Website:\n\nPhillip Kofler\nSoftwareingenieur | Fullstack Developer\nVillach, Kärnten, Österreich',
    'privacy.controller.contact': 'Du erreichst mich unter ',
    'privacy.controller.contactEnd':
        ' — zu allem, was in diesem Dokument steht, und natürlich auch, wenn du deine Rechte geltend machen möchtest.',

    'privacy.principle.title': 'Die kurze Fassung',
    'privacy.principle.text':
        'Ich erhebe keine personenbezogenen Daten über dich, die über das hinausgehen, was ein Webserver zwangsläufig sieht, wenn er deine Anfrage beantwortet. Ich setze keine Cookies. Ich verwende keine Analyse-Tools, keinen Tag Manager, kein Werbenetzwerk und keine Social-Plugins, die nach Hause funken. Ich baue keine Profile, ich verkaufe nichts an niemanden, und es interessiert mich ehrlich gesagt nicht, wer du bist — mir wäre lieber, du siehst dir einfach die Projekte an.',

    'privacy.logs.title': 'Server-Logfiles',
    'privacy.logs.text':
        'Wenn du eine Seite öffnest, erreicht deine Anfrage meinen Webserver (Caddy). Er schreibt pro Anfrage eine Logzeile mit Zeitpunkt, angefragtem Hostnamen, HTTP-Methode und -Protokoll, Antwortstatus, Größe und Dauer der Antwort sowie technischen TLS-Verbindungsdetails. Bevor eine Zeile geschrieben wird, werden deine IP-Adresse, der aufgerufene Pfad samt Query-String und alle Request- und Response-Header (auch Referrer und User-Agent) entfernt. Deine IP-Adresse speichere ich im Server-Log daher nicht.\n\nDas Log brauche ich, damit die Seite funktioniert: um Seiten auszuliefern und Fehler zu finden. Rechtsgrundlage ist mein berechtigtes Interesse am sicheren und störungsfreien Betrieb dieser Website (Art. 6 Abs. 1 lit. f DSGVO). Die Logzeilen werden mit nichts anderem zusammengeführt, nie zur Identifikation deiner Person verwendet und nur kurz in einem größenbegrenzten, rotierenden Log aufbewahrt, bevor sie überschrieben werden.\n\nUm Missbrauch wie Brute-Force-Versuche gegen den Admin-Login zu bremsen, zählt die Anwendung Anfragen pro Verbindungsadresse ausschließlich im Arbeitsspeicher. Diese Zähler werden weder auf Festplatte noch in der Datenbank gespeichert und verschwinden bei einem Neustart der Anwendung.',

    'privacy.hosting.title': 'Hosting und Infrastruktur',
    'privacy.hosting.text':
        'Die Seite läuft als Container auf einem virtuellen Server (VPS) von Contabo, auf dem der Webserver Caddy die verschlüsselte Verbindung entgegennimmt. Das ist der einzige Host, der beim Besuch deine Verbindung sieht. Die Inhalte (Projekte, Technologien, Status-Messwerte) liegen in einer MongoDB-Atlas-Datenbank, und meine planmäßigen Statusprüfungen laufen als Microsoft-Azure-Function. Atlas und Azure tauschen Daten nur mit meinem eigenen Server bzw. Prüfdienst aus, nicht mit deinem Browser. Contabo, MongoDB und Microsoft verarbeiten Daten ausschließlich nach meinen Weisungen als Auftragsverarbeiter gemäß Art. 28 DSGVO.\n\nIch habe sie wegen ihrer Zuverlässigkeit gewählt, nicht wegen irgendwelcher Daten. In der Datenbank liegen keine Besucherdaten — dort steht nur, was ich selbst über meine Arbeit hineingeschrieben habe, sowie die Ergebnisse meiner eigenen Statusprüfungen.\n\nDie Statusseite greift außerdem auf Metrion zurück, eine zweite Anwendung von mir. Die Werte kommen vom Ingest-Dienst und der selbst gehosteten PostgreSQL/TimescaleDB-Datenbank von Metrion, beide auf demselben Contabo-VPS; dort werden Verfügbarkeitsmessungen (Monitorname, erreichbar/nicht erreichbar, Antwortzeit) ohne feste Löschfrist aufbewahrt. Das Metrion-Dashboard läuft auf Microsoft Azure Container Apps, ist an der Statusabfrage aber nicht beteiligt. Metrion ist mein eigener Dienst und kein Dritter — der einzige Datenverkehr, den es von dieser Seite bekommt, ist die weiter unten beschriebene Server-zu-Server-Statusabfrage, also verarbeitet auch Metrion keine Besucherdaten.',

    'privacy.fonts.title': 'Schriftarten',
    'privacy.fonts.text':
        'Die verwendeten Schriften (Manrope und JetBrains Mono) liegen auf meinem eigenen Server und werden von dort ausgeliefert. Dein Browser baut dafür keine Verbindung zu Google Fonts oder einem anderen fremden Server auf, und es wird dabei auch keine IP-Adresse an Dritte übermittelt.',

    'privacy.storage.title': 'Was in deinem Browser gespeichert wird',
    'privacy.storage.text':
        'Diese Seite setzt keine Cookies. Sie nutzt aber den lokalen Speicher deines Browsers für zwei kleine Einstellungen, damit die Seite so bleibt, wie du sie verlassen hast:\n\n• theme — ob du die helle oder die dunkle Darstellung bevorzugst\n• locale — die Sprache, die du gewählt hast\n\nZusätzlich merkt sich der Session-Speicher, dass du die Boot-Animation bereits gesehen hast, damit sie nicht bei jedem Aufruf im selben Tab erneut läuft. Alle drei Werte bleiben auf deinem Gerät, werden nie an meinen Server geschickt, und du kannst sie jederzeit in den Einstellungen deines Browsers löschen. Nichts davon identifiziert dich.',

    'privacy.contact.title': 'Kontakt mit mir',
    'privacy.contact.text':
        'Es gibt auf dieser Seite bewusst kein Kontaktformular — ein Formular würde bedeuten, dass ich deine Daten über meinen Server einsammle. Stattdessen verlinke ich meine E-Mail-Adresse und mein LinkedIn-Profil. Wenn du mir schreibst, verarbeite ich das, was du mir schickst (deine Adresse, deinen Namen, wenn du ihn nennst, und den Inhalt deiner Nachricht), ausschließlich, um dir zu antworten — auf Grundlage von Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO. Ich behalte solche Korrespondenz nur so lange, wie es die Sache erfordert, und lösche sie, sobald sie erledigt ist.',

    'privacy.status.title': 'Die Statusseite',
    'privacy.status.text':
        'Die Statusseite zeigt, ob meine eigenen Dienste erreichbar sind. Sie stützt sich auf zwei Systeme, die ich selbst betreibe. Das erste sind meine eigenen, planmäßigen Prüfungen, die meine Deployments einmal pro Minute aufrufen (und bei einem Fehlschlag sofort noch ein zweites Mal) und das Ergebnis in meiner MongoDB-Datenbank speichern — Antwortzeit, erreichbar/nicht erreichbar, den HTTP-Statuscode und bei einer fehlgeschlagenen Prüfung eine kurze technische Fehlermeldung, die auf einen Netzwerk-Fehlercode wie (ECONNRESET) enden kann. Diese Ergebnisse in MongoDB werden nach 90 Tagen gelöscht. Am 21. September 2026 habe ich zusätzlich die Ergebnisse „erreichbar/nicht erreichbar“ und die Antwortzeiten aller bis dahin erhobenen Prüfungen (nicht den Statuscode und nicht die Fehlermeldung) in Metrion kopiert, wo sie ohne feste Löschfrist aufbewahrt werden, damit die Verfügbarkeitshistorie meiner Dienste über 90 Tage hinaus erhalten bleibt. Das zweite System ist Metrion, eine eigenständige Monitoring-Anwendung von mir, deren Ingest-Dienst und selbst gehostete PostgreSQL/TimescaleDB-Datenbank auf meinem Contabo-VPS laufen; sie bewahrt Monitorname, erreichbar/nicht erreichbar und Antwortzeit ihrer eigenen Prüfungen auf dieselbe Weise ohne feste Löschfrist auf. Außerdem zeigt die Seite den Median und das 95. Perzentil der Antwortzeit der letzten 24 Stunden, berechnet aus den gespeicherten Antwortzeiten.\n\nMein Server ruft die Werte von Metrion über dessen öffentliche API server-seitig ab, dein Browser stellt also nie eine Anfrage an Metrion, und keine Besucher-IP erreicht es auf diesem Weg. Beide Systeme messen meine Infrastruktur, nicht dich: Diese Prüfergebnisse beschreiben meine eigenen Dienste und enthalten keine Besucherdaten. Meine Rechtsgrundlage für die Aufbewahrung dieser Historie ist mein berechtigtes Interesse, die Verfügbarkeit meiner eigenen Dienste zu dokumentieren (Art. 6 Abs. 1 lit. f DSGVO).',

    'privacy.admin.title': 'Der Admin-Bereich',
    'privacy.admin.text':
        'Es gibt eine Login-Route, die nur ich benutze, um die Inhalte der Seite zu pflegen. Sie stellt ein signiertes Token für meinen eigenen Browser aus und speichert keinerlei Daten über Besucher. Passwörter werden nie im Klartext gespeichert, sondern nur als Hash.',

    'privacy.career.title': 'Werdegang und Ausbildung',
    'privacy.career.text':
        'Die Karriere-Zeitleiste auf der Startseite zeigt meinen eigenen beruflichen und schulischen Werdegang — die Organisationen, bei denen ich gearbeitet oder studiert habe, und die entsprechenden Zeiträume. Das sind personenbezogene Daten über mich, den Betreiber dieser Seite, die ich selbst als beruflichen Nachweis veröffentliche; nichts davon betrifft dich oder andere Besucher:innen. Die dort genannten Organisationsnamen (etwa Infineon Technologies, HTL Villach oder das BG/BRG Peraugymnasium) sind keine personenbezogenen Daten im Sinne der DSGVO, die natürliche Personen schützt, nicht Unternehmen oder Schulen — und es wird auch keine einzelne Person dort namentlich genannt. Meine Rechtsgrundlage für die Veröffentlichung meines eigenen Werdegangs ist mein berechtigtes Interesse als jemand, der Softwareentwicklungs-Dienstleistungen anbietet, meine Qualifikationen und Erfahrung zu zeigen (Art. 6 Abs. 1 lit. f DSGVO).',

    'privacy.sharing.title': 'Weitergabe an Dritte',
    'privacy.sharing.text':
        'Ich gebe deine Daten an niemanden weiter. Die Einzigen, die sie überhaupt berühren, sind die oben genannten Auftragsverarbeiter, die sie brauchen, um die Seite online zu halten, sowie Behörden, denen ich gesetzlich Auskunft geben muss. Es gibt keinen Verkauf, keinen Tausch und keine Übermittlung zu Werbezwecken — mit den Daten, die ich habe, wäre das nicht einmal möglich.',

    'privacy.security.title': 'Sicherheit',
    'privacy.security.text':
        'Der Datenverkehr zu dieser Seite ist per TLS (HTTPS) verschlüsselt. Die Anwendung läuft als unprivilegierter Benutzer in einem Container, Geheimnisse liegen außerhalb des Quellcodes, und ich halte die Abhängigkeiten aktuell. Absolute Sicherheit kann bei einer Übertragung über das Internet niemand garantieren — aber je weniger Daten eine Seite hält, desto weniger kann verloren gehen. Genau deshalb hält diese hier so wenige.',

    'privacy.rights.title': 'Deine Rechte',
    'privacy.rights.text':
        'Nach der DSGVO hast du das Recht, Auskunft über die Daten zu verlangen, die ich über dich habe, sie berichtigen oder löschen zu lassen, die Verarbeitung einschränken zu lassen, die Daten in einem übertragbaren Format zu erhalten und der Verarbeitung auf Grundlage berechtigter Interessen zu widersprechen.\n\nSchreib mir einfach, ich antworte innerhalb eines Monats. In der Praxis wird die ehrliche Antwort meistens lauten, dass ich außer einer kurzlebigen Logzeile überhaupt nichts über dich habe.\n\nAußerdem hast du das Recht, dich bei einer Aufsichtsbehörde zu beschweren. In Österreich ist das die Datenschutzbehörde in Wien.',

    'privacy.changes.title': 'Änderungen dieser Erklärung',
    'privacy.changes.text':
        'Wenn ich ändere, was diese Seite tut, ändere ich auch diese Erklärung. Das Datum oben sagt dir, welche Fassung du gerade liest.',

    'imprint.contact': 'Kontakt: ',
    'imprint.privacyLink': 'Zur Datenschutzerklärung',

    'privacy.imprint.title': 'Impressum',
    'privacy.imprint.text':
        'Angaben gemäß §5 ECG und §25 MedienG:\n\nPhillip Kofler\nSoftwareingenieur | Fullstack Developer\nVillach, Kärnten, Österreich\n\nTätigkeitsbereich: Softwareentwicklung, Webentwicklung und digitale Lösungen — moderne Webanwendungen, REST-APIs, Dashboards und cloudbasierte Systeme.\n\nVerantwortlich für den Inhalt dieser Seite: Phillip Kofler. Die Inhalte erstelle ich sorgfältig, eine Gewähr für Richtigkeit, Vollständigkeit oder Aktualität übernehme ich jedoch nicht. Auf die Inhalte verlinkter externer Seiten habe ich keinen Einfluss und übernehme dafür keine Haftung. Alle Inhalte dieser Seite unterliegen dem Urheberrecht; eine Nutzung außerhalb der gesetzlichen Grenzen bedarf vorab meiner Zustimmung.',

    'secret.meta.title': 'Für Helmi (aka. die Liebe meines Lebens)',
    'secret.meta.description': 'Etwas Kleines, das niemand zufällig finden sollte.',
    'secret.gate.title': 'Du hast etwas gefunden',
    'secret.gate.subtitle': 'Es ist aber verschlossen. Du kennst das Wort.',
    'secret.gate.password': 'Passwort',
    'secret.gate.show': 'Passwort anzeigen',
    'secret.gate.hide': 'Passwort verbergen',
    'secret.gate.submit': 'Aufmachen',
    'secret.gate.error': 'Nicht ganz. Versuch es nochmal.',
    'secret.gate.offline': 'Server nicht erreichbar. Versuch es nochmal.',
    'secret.gate.back': 'Lieber doch nicht — zurück zur Startseite',
    'secret.heading': 'Für Helmi (aka. die Liebe meines Lebens)',
    'secret.message':
        'Manche Dinge kann man nicht bauen, egal, wie gut man darin wird. Man hat einmal Glück — und danach ist man jeden einzelnen Tag dankbar dafür. Du bist das Beste in meinem Leben: der Mensch, dem ich alles zuerst erzählen will, und der aus einem ganz gewöhnlichen Abend den Ort macht, an dem ich am liebsten bin. Danke, dass es dich gibt.',
    'secret.since': 'Zusammen seit 25.12.2025, 15:37:48',
    'secret.milestone.badge': 'Heute sind es {months} Monate',
    'secret.milestone.message':
        'Ich hab immer gedacht, so was legt sich mit der Zeit. Tut es aber nicht. Dein Name leuchtet am Handy auf und ich freu mich, jedes Mal. Und ehrlich, die schönsten Tage waren die, an denen wir eigentlich gar nichts gemacht haben.',

    'secret.gift.badge': 'Ein Geschenk für dich',
    'secret.gift.title': 'Virtueller Geschenkgutschein',
    'secret.gift.delivered': 'Geliefert am Samstag, 25. Juli, an {name}',
    // The note stays in the language it was actually written in - it is a quote,
    // not interface copy.
    'secret.gift.line1': 'I love you so fucking much {heart}',
    'secret.gift.line2':
        'I never knew that an person like you could make my life so colorful again and give it a purpose again. I wanna live with you forever and also die together.',
    'secret.gift.line3': 'I never ever wanna loose you...',
    'secret.gift.download': 'Beleg herunterladen',
    'secret.gift.downloading': 'Wird geholt…',
    'secret.gift.downloadError': 'Hat nicht geklappt. Sperr die Seite nochmal auf.',
    'secret.gift.downloadOffline': 'Server nicht erreichbar. Versuch es nochmal.',
    'secret.stillCounting': '…und ich zähle weiter. Ich liebe dich ❤️',
    'secret.unit.years': 'Jahre',
    'secret.unit.months': 'Monate',
    'secret.unit.days': 'Tage',
    'secret.unit.hours': 'Stunden',
    'secret.unit.minutes': 'Minuten',
    'secret.unit.seconds': 'Sekunden',
};
