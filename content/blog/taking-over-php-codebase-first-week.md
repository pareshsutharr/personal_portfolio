---
title: "Taking over a PHP codebase: the first-week checklist"
description: "The 8th Sense Production House site was my first takeover: a custom PHP CMS with no version control, no docs, and a live client. What I did in the first week, in order, so the site stayed up while I learned it."
date: 2027-04-26T03:30:00Z
tags: [php, legacy, process, deployment]
keywords: [take over legacy php project, legacy codebase checklist, inherit website from another developer, php project no version control, legacy code first steps]
project: 8th-sense-production-house
image: /blog/stock/surat-1.webp
imageAlt: "Painting of the harbour at Surat, Gujarat"
imageCredit: "Rijksmuseum"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Gezicht_op_de_haven_van_S%C5%ABrat_(Gujar%C4%81t),_SK-A-4778.jpg"
imageLicense: "CC0"
---

The first codebase I was paid to take over was a multimedia site with a custom PHP CMS. The previous developer had moved on. There was a cPanel login, an FTP password, and a folder with 600 files. The client wanted a new section added "this week". Here is what I did instead, in the order I would do it again.

## Day 1: make it impossible to lose

Before reading a line of code, take a full copy of the files and the database and put it somewhere that is not the server.

```bash
# from a machine you control
rsync -avz user@host:/home/site/public_html/ ./backup-2024-01-10/
ssh user@host "mysqldump -u dbuser -p dbname | gzip" > ./backup-2024-01-10.sql.gz
```

Then put the files into git, locally, with a first commit called "as found". Every change from here is a diff you can read and revert. Add a `.gitignore` for uploads and config with passwords before the first push to a private repository.

## Day 1, later: find out what is actually running

- PHP version: `php -v` on the server, and check what the host will keep supporting.
- Which files are reachable: `grep -rl "<?php" public_html | wc -l` versus the number referenced from the entry points. The site had 600 files and used about 140.
- Where the database connection is made. There is usually one `config.php` or `db.php`; every other secret follows from it.
- Cron jobs: `crontab -l` and the hosting panel. One of them was emailing a report to a mailbox nobody read.

Write all of this in a `NOTES.md` in the repo. It is the documentation that did not exist.

## Day 2: a staging copy

Never learn on the live site. A subdomain on the same host with a copy of the files and a copy of the database. Point the config at the copy. Now you can break things.

If the host cannot do a subdomain, a Docker container with the matching PHP version and MySQL does the same job on your laptop.

## Day 2 and 3: read the entry points, not the files

Start from `index.php` and follow the includes. Draw the request flow on paper: URL, router or `switch`, handler, template. In this CMS it was one file per page with a shared header and footer; the admin was a second tree of the same shape. Two hours of reading was worth more than any amount of grepping.

Things I look for specifically:

- SQL built with string concatenation. There were 23 queries like `"SELECT * FROM posts WHERE id = $_GET['id']"`. Each is an injection. Each got a prepared statement, one at a time, tested on staging.
- `echo $_GET[...]` or `echo $row[...]` without `htmlspecialchars`. Cross-site scripting.
- Passwords stored as MD5. Moved to `password_hash` with a rehash on next login.
- File uploads without type checks. Restricted to images and moved outside the web root.

## Day 4: the smallest possible first deploy

Not the new section. One fix, the most important injection, deployed by itself. The point is to exercise the deployment path while the change is tiny. Mine was `rsync` of changed files plus a manual database migration; later it became a script. The first deploy taught me the host cached PHP opcode for 60 seconds, which explained a "bug" I would otherwise have chased for an hour.

## Day 5: now the new section

With a backup, a repository, a staging copy, a map of the code and a working deploy, the client's request took an afternoon. Done in the first hour of day one, it would have taken the same afternoon and a week of fear.

## What I tell the client

- What I found, in plain words: "the site had security problems that are now fixed" and a list.
- What I changed and what I did not touch.
- That there is now a copy of everything, and where it is.

That conversation is what turned a one-week job into a longer relationship. People hire a developer; they keep the one who tells them the truth about their code.

## Sources

- PHP prepared statements with PDO: [php.net/manual/en/pdo.prepared-statements.php](https://www.php.net/manual/en/pdo.prepared-statements.php)
- `password_hash` and `password_needs_rehash`: [php.net/manual/en/function.password-hash.php](https://www.php.net/manual/en/function.password-hash.php)
- OWASP PHP security cheat sheet: [cheatsheetseries.owasp.org/cheatsheets/PHP_Configuration_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/PHP_Configuration_Cheat_Sheet.html)
- Working Effectively with Legacy Code, Michael Feathers, for the mindset: [informit.com](https://www.informit.com/store/working-effectively-with-legacy-code-9780131177055)
