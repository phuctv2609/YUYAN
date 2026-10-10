# HSK2 Vietnamese Completion Patch

The source DOCX files contain 36 Hanzi lines and 36 Pinyin lines but only 32 Vietnamese translation lines for each HSK2 lesson. The final 4 Vietnamese lines were absent in the source.

This patch adds Vietnamese translations for those final 4 lines in all 15 HSK2 lessons, derived directly from the corresponding source Hanzi lines. These 60 translations are generated translations, not source text from the DOCX. Existing source Vietnamese lines were not overwritten.

Result: 15/15 HSK2 lessons now have 36/36/36 aligned Hanzi/Pinyin/Vietnamese entries.
