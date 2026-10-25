[![Revertices logo](assets/media/img/logo-small-gif.gif)](https://revertices.com)

# V2 Overview

V2 is based on V1 by Lex Feathers with layout/design by Abigail Dennehy and implemented by Leah Case.

V2 is similar to V1 but with slight differences in how reusable content is handled:

- Instead of `/common` there is `/_partials`
  - When a file in `/partials` in edited, run `node sync.mjs`. Requires node installed (you can also ask Leah to do it), which inserts the content into the files
  - Inserting it into the file w/o JS means it can be picked up by search engines!

- Now uses Alpine JS
  - Basically lets you write JS on HTML, just used for simple cosmetic/optional functionality

- Legacy filters/folders
  - /pages
  - /common
  - /posts

> **Note**: Image mask for the homepage eyeball doesn't work when opening the .html file locally unless it's on a webserver due to browser security weirdness. Also, depending on browser (i.e. firefox vs chrome) the fancier transitions/CSS may or may not run.

# Legacy README

## This is the **Revertices** website.

It was built from scratch (for some reason) by Lex Feathers.


Some quick tips:

- Edit the HTML files in the /pages directory to change the page contents
- The footer links can be edited in /common/footer.html
- The top of /styles/base.css has a bunch of CSS variables you can modify to change things like the colour, logo size, page width, and so on.
- h2 elements will give you a highlighted title, like on the about page currently
