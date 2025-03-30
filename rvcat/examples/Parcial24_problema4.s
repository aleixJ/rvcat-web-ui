fld     Wi,W(i)              "Wi = W[i]"             % addr=0 stride=8 N=25
addi    i,i,1                "i = i + 1"
fmul.d  t3,t0,t3             "t3 = t0 * t3"
fsub.d  t0,t2,t0             "t0 = t2 - t0"
fmul.d  t4,t1,t2             "t4 = t1 * t2"
fsd     t4,V(j)              "V[j] = t4"             % addr=10000 stride=8 N=25
addi    j,j,1                "j = j + 1"
fadd.d  t2,Wi,t1             "t2 = Wi + t1"
sub     c,N,i                "c = N != i"
bne     zero,c,label         "if c go back"