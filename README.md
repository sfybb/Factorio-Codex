# Factorio Codex
This mod adds a Satisfactory like codex and quick search to factorio.
Currently, this mod is in its Alpha stages. This means this mod might not be stable and there will be a changes
in the future to the functionality and maybe ui.

# Quick Search
By default, you can open quick search by pressing the `n` key on your keyboard.
This opens a text-box you can type into to search for items, fluids or technologies.
When you find what you searched for you can click on the search result, the codex will open and show more
information about what you clicked on.

### Functionality
* Search for any item, fluid or technology
* Results are sorted such that technologies appear last and the item or fluid with the best match of your
  search term appears first (hidden items, fluids or technologies get excluded from the search)
* Clicking on a search result will show more information about that item in the codex
* While translation is taking place you will be asked to wait until it's finished before any results get shown to you.
* If this mod completed the translation stage in this save before, this old data will be used for searches until the
  translation completes. However, this old data will not contain any information about new items, fluids and
  if you search for those you still have to wait.
* Compute the solutions to math formulas like "144/45" or "15/3.2". Also supports brackets!
* Math formulas respect the order of operations: exponents '^' first, then multiplication '*' or division '/'
  and lastly addition '+' or subtraction '-' (the evaluation progresses from left to right except for exponents,
  which go the opposite way: 3^2^5 => 3^10 )
* Clicking on the result of a math formula will overwrite the search field with the result
  (Note: results that contain 'e' like "1e+100" are not considered part of a valid math formula 
  and need to be changed by you! To get a usable number you have to replace 'e' with '10^' and the following '+'
  sing but keep a '-' sign)


# Codex
The codex can only be opened by using the [Quick Search](#Quick-Search) (default key `n`) and clicking on a non math result
(clicking on "Waiting for translation..." also doesn't take you to the codex)
The codex shows information about items, fluids and technologies. At the moment the main focus of the codex is showing
ways to produce or consume items/fluids. Viewing technologies gives information about modifiers / recipes this technology unlocks.

### Functionality
* Items

--------------------
## Codex

Currently only the in game description and possible recipes are shown.
However rocket launch products and maybe other things aren't visible yet

# TODO List
- [X] Improve search functionality and sorting
- [ ] Recipes with **only** burner machines need some sort of indication that they are not free 
- [ ] Open inventory/technology tree from codex IF possible
- [ ] Add locale support for hardcoded english stuff and hotkey name
- [ ] Add search to codex (low priority since quick search exists)
- [ ] Better recipe support (e.g. show output chance, min and max ...)
- [ ] Better description for items/entities ...
- [ ] Think about more TODO's

# Changelog
See [Changelog](Changelog.md)
