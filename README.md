<H3>BEE HIVE</H3>

Bee Hive inserts itself onto the NYT Spelling Bee web page, then tallies your <br>
found words onto the Spelling Bee HINTS grid.  This only works on computers, not<br>
phones.  Stay tuned; I may make a phone version later.<br>
To use this program, you must start it from a bookmarklet.  You only need to do the<br>
bookmarklet installation in step 1 once.  Afterwards just click on your bookmarklet<br>
while on the Spelling Bee web page.


1.  From Bookmark manager, create a new boookmark.	
	- Copy the block of text below: 

        <dt><table id="bookmarklet" word-wrap="normal"><tr>
		<td><pre> javascript:fetch('https://raw.githubusercontent.com/PostDoc71/SpellingBeeHelp/main/SpellingBoss.js').then(r => r.text()).then(t => eval(t)) </pre><td>
		</tr></table>
		</dt>

	- In Chrome and Edge:  CTL-D, then [More].
	- Paste the copied text into the URL box.<br>
		Name: Bee Hive (or whatever)<br>
		URL: paste the copied text here 

2.  To use:

	- Launch Spelling Bee ('https://www.nytimes.com/puzzles/spelling-bee').
	- Click the Bee Hive bookmarklet on your Bookmarks bar.

This should ease the task of tallying your entries!<br><br>

Happy Hiving!<br>
postDoc71 (ie retired pediatrician as of age 71)