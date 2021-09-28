DATA    segment
V1 db -128
V2 db 255
V4 db -128
V5 db -127

B1 dw 32768
B2 dw -32768
B3 dw 32767
B4 dw -32768
B6 dw 65535

A1 dd 0fah
A2 dd -100100b
A4 db 100100b

E equ L2
E1 equ -0fah
E2 equ -23
E23 equ 23
E25 equ 65537
E8 equ ah
E9 equ eax
E0 equ [edx*2]
E10 equ byte ptr ds:[ebp*2]
DATA    ends

CODE segment
L1:
jmp L1
jmp L2
jz L1
jz L2
    stosd
    dec al
    dec eax
    dec ah
    dec ebp
    dec E8
    dec E9

    mul byte ptr E0
    mul dword ptr E0
    mul E10
    mul dword ptr[eax*2]
    mul dword ptr[ecx*2]
    mul dword ptr ds:[edx*2]
    mul dword ptr es:[ebx*2]
    mul dword ptr ss:[ebp*2]
    mul dword ptr[esi*2]
    mul dword ptr gs:[edi*2]
    mul dword ptr[edi*4]
    mul dword ptr[edi*8]
    mul dword ptr gs:[edi*1]
    mul byte ptr[eax*2]
    mul byte ptr fs:[ecx*2]
    mul byte ptr[edx*2]
    mul byte ptr[ebx*2]
    mul byte ptr ds:[ebp*2]
    mul byte ptr[esi*2]
    mul byte ptr ss:[edi*2]
    mul byte ptr ds:[edi*4]
    mul byte ptr ss:[edi*8]
    mul byte ptr[edi*1]

    movzx  eax,ah
    movzx  eax,E8
    movzx  E9,bl
    movzx  ecx,bl
    movzx  ecx,bl
    movzx  edx,bl
    movzx  ebx,bl
    movzx  ebp,bl
    movzx  esp,bl
    movzx  esi,bl
    movzx  edi,bl
    movzx  E9,E8

    and E0,E8
    and ds:[ecx*2],eax
    and E0,ecx
    and gs:[ebx*2],ebx
    and ss:[ebp*2],edx
    and [esi*2],ah
    and ss:[edi*2],bh
    and [edi*4],ch
    and [edi*8],ebp
    and [edi*1],esp
    and [eax*2],eax
    and ds:[ecx*2],bl
    and fs:[edx*2],ch
    and [ebx*2],ebp
    and ds:[ebp*2],esp
    and [esi*2],edi
    and [edi*2],esi
    and es:[edi*4],esi
    and [edi*8],edi
    and ss:[edi*1],ebp

    or E8,[eax*2]
    or ah,ds:[ecx*2]
    or ah,E0
    or eax,gs:[ebx*2]
    or eax,ss:[ebp*2]
    or eax,[esi*2]
    or esp,ss:[edi*2]
    or esp,[edi*4]
    or esp,[edi*8]
    or ebp,[edi*1]
    or ebp,[eax*2]
    or ebp,ds:[ecx*2]
    or ecx,fs:[edx*2]
    or ecx,[ebx*2]
    or ecx,ds:[ebp*2]
    or ecx,[esi*2]
    or ecx,[edi*2]
    or ch,es:[edi*4]
    or ch,[edi*8]
    or ch,ss:[edi*1]

    test al,-23
    test eax,23
    test eax,0fah
    test eax,-0fah
    test edx,45
    test bh,-1010101b
    test bh,100101b
    test bh,250
    test bh,255
    test bh,-128
    test bh,-129
    test bh,-250
    test bh,-255
    test E8,-256

    mov dword ptr[eax*2],101010b
    mov dword ptr es:[ecx*2],0fah
    mov dword ptr[edx*2],-0fah
    mov dword ptr[ebx*2],0fffh
    mov dword ptr ss:[ebp*2],1011001b
    mov dword ptr[esi*2],-101010b
    mov dword ptr[edi*2],-129
    mov dword ptr[edi*4],231
    mov dword ptr ss:[edi*8],100
    mov dword ptr[edi*1],123
    mov byte ptr[eax*2],129
    mov byte ptr es:[ecx*2],-19
    mov byte ptr[edx*2],-0ffh
    mov byte ptr ds:[ebx*2],-101010b
    mov byte ptr ds:[ebp*2],-10010011b
    mov byte ptr[esi*2],-13
    mov byte ptr ss:[edi*2],255
    mov byte ptr[edi*4],-256
    mov byte ptr fs:[edi*8],0fah
    mov byte ptr ds:[edi*1],-0fah
    mov E10,-0fah
    L2:
    jmp L1
    jmp L2
    jmp E
    jz L1
    jz L2
CODE ends
end