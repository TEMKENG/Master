	.org 0x0000 ; alles folgende start ab Adresse 0
	.start
	ldil  		r1, 1
	ldih 		r1, 0
	; xor 0x100 =0
xor:                     
	ldil  		r7,  0x00 
	ldih 		r7,  0x01 ; r7:=0x0100
	xor			r0, r7, r7; r0:=0
	st			[r7], r0 ; speichern r0 in adresse r7
	
	;sal 0x101 = 0x10=16
sal:
	ldil 		r0, 0x08; ; ro:= 0x08
	add 		r7, r7, r1;  Zieladresse erhoehen
	sal 		r0, r0; shift nach links
	st			[r7], r0; speichern von ro in der Adresse r7
	
	;sar 0x102= 0x08
sar:
	ld 			r2, [r7]; Laden des Wertes von der Speicheradresse r7 in r2
	sar 		r0, r0; shift nach rechts
	add 		r7, r7, r1; Zieladresse erhoehen
	st			[r7], r0 ; speichern von ro in der adresse r7
	
	;sub 0x103= 0xf00f -0x0ff0 = 0xE01F
sub:
	ldil		r0, 0x0f ; 
	ldih		r0, 0xf0; r0 :=0xf00f
	ldil		r2, 0xf0
	ldih		r2, 0x0f; r2:=0x0ff0
	sub			r0, r0, r2; ro:= r0-r2
	add 		r7, r7, r1; Zieladresse erhoehen
	st			[r7], r0; speichern von ro in der Adresse r7
	
	; not 0x104= 0xf00f
not:
	not			r0, r2 ; ro:= not r2
	add 		r7, r7, r1; Zieladresse erhoehen
	st			[r7], r0;speichern von ro in der Adresse r7

	;and 0x105= 7
and:
	ldih		r2, 0 ;
	ldil		r2, 7 ; r2 := 7
	ldih		r3, 0xFF
	ldil		r3, 0xFF; r3 := 0xFFFF;
	and			r0, r2, r3 ; r0:= r2 and r3
	add 		r7, r7, r1; Zieladresse erhoehen
	st			[r7], r0 ;speichern von ro in der Adresse r7

	; or 0x106 = oxffff
or:
	ldil 		r0, 0xAA
	ldih 		r0, 0xAA ; r0:= 0xAAAA
	ldil		r2, 0x55
	ldih		r2, 0x55 ; r2:= 0x5555
	or			r0, r0, r2; r0 := r0 or r2
	add 		r7, r7, r1 ; Zieladresse erhoehen
	st			[r7], r0 ; speichern von ro in der Adresse r7
	
	;jmp|jz 0x107 = 5+4+3+2+1=15=0x0000f
	ldil		r2, 0x05
	ldih		r2, 0x00 ; r2:= ox0005
	xor			r0, r0, r0 ; r0 := r0 xor r0
	ldil		r4, end & 255 ; r4:= end(Adresse) 
	ldih		r4, end >> 8 
	ldil		r3, loop & 255 ;r3:= loop (Sprungadresse)
	ldih		r3, loop >> 8 
loop:

	jz			r2, r4; spring auf end when r2 :=0
	add 		r0, r0, r2; Zieladresse erhoehen
	sub 		r2, r2, r1;  r2:=r2-1 ; Schleifenzaehler erniedrigen
	
	jmp 		r3 ; spring nach loop
end:
	add 		r7, r7, r1 ;Zieladresse erhoehen
	st			[r7], r0 ; speichern von ro in der Adresse r7

	;jnz 0x108 =2+1=0x0003
	ldil		r2, 0x02
	ldih		r2, 0x00 ; r2:= ox0002
	xor			r0, r0, r0 ; r0:=0
loop1:
	add 		r0, r0, r2 ;r0 := r0+r2
	sub 		r2, r2, r1; r2:= r2+r1
	ldil		r3, loop1 & 255 ; r3:= loop (Sprungadresse)
	ldih		r3, loop1 >> 8 
	jnz 		r2, r3 ;  spring nach loop falls r2!=0
	
	add 		r7, r7, r1 ;Zieladresse erhoehen
	st			[r7], r0 ; speichern von ro in der Adresse r7

	halt        ;prozessor anhalten

	.org 0x0100
	.res 16
	.end