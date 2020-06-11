.org 0x0000
.start

	; Multiplikant a in r0 aus 0x0100
	ldil	r7, 0x00
	ldih	r7, 0x01
	ld	r0, [r7]
	; Multiplikator b in r1
	ldil	r7, 0x01
	ld	r1, [r7]
	; Wenn ro oder r1 zero ist, dann fertig
	ldil	r7, result & 255 ; r7 := result(Adresse)
	ldih	r7, result >> 8
	xor 	r6, r7, r7 ; r6:=result :=0
	jz	r0, r7
	jz	r1, r7
	
	;  r2:= 0x8000 = 1000 0000 0000 0000
	ldil	r2, 0x00
	ldih	r2, 0x80
	; Zaehler i r3 = 16
	ldil	r3, 16
	ldih	r3, 0

	ldil	r5, 1 	;r5 = 1 Konstante
	ldih	r5, 0
	
loop:
	;Prüfen, ob alle Schleife durchlaeufen schon durchgeführt sind.
	ldil	r7, result & 255 	; r7 := result(Adresse)
	ldih	r7, result >> 8
	jz 		r3, r7 				; zaeler == 0
	
	;Prüfen, ob es ein eins(1) in der binären Darstellung von b in 
	; der i.te Position von b:= r1 gibt.
	and 	r4, r1, r2
	ldil	r7, addi & 255 		; r7 := addi(Adresse)
	ldih	r7, addi >> 8
	jnz  	r4, r7				;Springt zu addi, wenn r4 != 0
	
	; Wenn die partiele Ergebnis ungleich Zeros ist, dann es verdoppelt
	ldil	r7, mul2 & 255 		; r7 := mul2(Adresse)
	ldih	r7, mul2 >> 8
	jnz  	r6, r7				;Springt zu mul2, wenn r6 != 0
	
	; Pamerater aktualisieren
	ldil	r7, update & 255 	; r7 := update(Adresse)
	ldih	r7, update >> 8
	jmp		r7					;Springt zu update
addi:
	ldil	r7, muladd & 255 	; r7 := muladd(Adresse)
	ldih	r7, muladd >> 8
	jnz		r6, r7				;Springt zu muladd, wenn r6 != 0
	add  	r6, r6, r0			;Erste Schleife Durchlauf
	ldil	r7, update & 255 	; r7 := update(Adresse)
	ldih	r7, update >> 8		
	jmp   	r7					;Springt zu update
	
mul2:
	sal r6, r6 					; r6 *=2
	ldil	r7, update & 255 	; r7 := update(Adresse)
	ldih	r7, update >> 8
	jmp   	r7 					;Springt zu update
muladd:
	sal 	r6, r6 				; r6 *=2
	add		r6, r6, r0			; r6 = r6 + r0 = r6 + a
update:
	sub 	r3, r3, r5 			; zaeler dekrementieren r3 -=1
	sal 	r1, r1	   			; b=r1=r1*2 = b*2
	ldil	r7, loop & 255 		; r7 := loop(Sprungdresse)
	ldih	r7, loop >> 8
	jmp		r7					;Springt zu loop

result:
	ldil	r7, 0x02 			; r7 := Ergebnis Adresse
	ldih	r7, 0x01
	st	[r7], r6 				; Ergebnis speichern
	halt

	.org 0x0100
	.data 40, 2 				;a=(Wert=40 Adresse=0x0100) , b=(Wert=2 Adresse=0x0101)
	.res 1						;Speicherplatz fuer Ergebnis reservieren
	.end
