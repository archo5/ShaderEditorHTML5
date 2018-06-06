
run: hdri2ldrcube.exe
	hdri2ldrcube

hdri2ldrcube.exe: hdri2ldrcube.c
	gcc -o $@ -O2 -fopenmp -std=c99 -Wall -Wextra -Wno-unused-parameter $<
