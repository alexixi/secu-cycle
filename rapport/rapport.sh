#!/bin/bash
pdflatex rapport.tex
pdflatex rapport.tex
bibtex rapport.aux
pdflatex rapport.tex
rm rapport.aux
rm rapport.toc
rm rapport.log
rm rapport.out
rm rapport.bbl
rm rapport.blg
evince rapport.pdf