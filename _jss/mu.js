
goog.provide('test');

goog.require('goog.fx.Dragger');
goog.require('goog.events');

const MUTATING=0;
const ADD_NODES=1;
const WAIT_FOR_NEW_SOURCE=2;
const WAIT_FOR_NEW_TARGET=3;
const DEL_NODES=4;
const FREEZE_NODES=5;
const WAIT_FOR_NEW_VSOURCE=6;
const WAIT_FOR_NEW_VTARGET=7;
const WAIT_FOR_NEXT_NODE=8;

function drawarrow(P, Q, rho, ctx){

    const arrowheadwidth=0.2;
    const arrowheadlength=0.25;

    var a,b,c,d, dist;
    var P1, Q1, R, R1;

    //console.log("P: "+P.x+","+P.y+" Q: "+Q.x+","+Q.y);
    dist=Math.sqrt((P.x-Q.x)*(P.x-Q.x)+(P.y-Q.y)*(P.y-Q.y));
    //console.log("dist="+dist);
    Q1={x:Q.x+(rho/dist)*(P.x-Q.x), y:Q.y+(rho/dist)*(P.y-Q.y)};
    P1={x:P.x, y:P.y};
    ctx.beginPath();
    ctx.moveTo(P1.x,P1.y);
    ctx.lineTo(Q1.x,Q1.y);
    ctx.lineWidth=2;
    ctx.strokeStyle = "black";
    ctx.stroke();
    if (dist>50){
        P1={x:Q1.x+(50/dist)*(P.x-Q1.x), y:Q1.y+(50/dist)*(P.y-Q1.y)};
    }
    //console.log("P1: "+P1.x+","+P1.y);
    a=-P1.x+Q1.x;
    b=-P1.y+Q1.y;
    c=P1.x;
    d=P1.y;
    R={x:1-arrowheadlength,y:0.5*arrowheadwidth};
    R1={x:0,y:0};
    //console.log("0 R: "+R.x+","+R.y);
    //console.log("a: "+a+" b: "+b+" c: "+c+" d: "+d);
    R1.x=a*R.x-b*R.y+c;
    R1.y=b*R.x+a*R.y+d;
    //console.log("b*R.x+a*R.y+d="+(b*R.x+a*R.y+d)+" R.y="+R.y);
    ctx.moveTo(R1.x,R1.y);
    R.x=1-arrowheadlength;
    R.y=-0.5*arrowheadwidth;
    R1.x=a*R.x-b*R.y+c;
    R1.y=b*R.x+a*R.y+d;
    ctx.lineTo(R1.x,R1.y);
    ctx.lineTo(Q1.x,Q1.y);
    ctx.closePath();
    ctx.fillStyle = "black";
    ctx.fill();
}

function array2D(rows, cols){
    var arr = [];
    for(var i=0; i < rows; i++){
        arr.push([]);
        arr[i].push(new Array(cols));
        for(var j=0; j < cols; j++){
            arr[i][j] = bigInt();
        }
    }
    return arr;
}

function Matrix(nbrows,nbcols){
    this.nbrows=nbrows;
    this.nbcols=nbcols;
    this.A=array2D(nbrows,nbcols);
}

Matrix.prototype.permuteRowsCols=function(rowperm,colperm){
    var i,j;
    var B=array2D(this.nbrows,this.nbcols);
    for (i=0;i<this.nbrows;i++){
        for (j=0;j<this.nbcols;j++){
            B[i][j]=this.A[rowperm[i]][colperm[j]];
        }
    }
    this.A=B;
};

Matrix.prototype.toString=function(){
    var str="";
    for (var i=0;i<this.nbrows;i++){
        for (var j=0;j<this.nbcols;j++){
            str=str+bigInt(this.A[i][j]).toString()+" ";
        }
        str=str+"\n";
    }
    return str;
};

Matrix.prototype.copyFrom=function(M){
    for (var i=0;i<M.nbrows;i++){
        for (var j=0;j<M.nbcols;j++){
            this.A[i][j]=M.A[i][j];
        }
    }
};

Matrix.prototype.omitRowCol=function(k){
    var N=new Matrix(this.nbrows-1,this.nbcols-1);
    N.A=[];
    for (var i=0;i<this.nbrows;i++){
        if (i!==k){
            var newRow=[];
            for (var j=0;j<this.nbcols;j++){
                if (j!==k){
                    newRow.push(this.A[i][j]);
                }
            }
            N.A.push(newRow);
        }
    }
    return N;
};

sign=function(p){
    return bigInt(p).compare(bigInt.zero);
};

strangeprod=function(p,q) {
    if(sign(p)*sign(q)<0){
        var z=0;
        return z;}
    else {
        if (sign(p)>0){return p.times(q);}
        else{
            var m1= -1;
            return (p.times(q)).times(bigInt.minusOne);}
    }
}



Matrix.prototype.mutate=function(k){
    var i,j;
    var B=array2D(this.nbrows,this.nbcols);
    for(i=0;i<this.nbrows; i++){
        for(j=0;j<this.nbcols;j++){
            if((i==k) || (j==k)){
                var m1=bigInt.minusOne;
                B[i][j]=bigInt(this.A[i][j]).times(m1);
            }
            else  {
                B[i][j]=bigInt(this.A[i][j]).add(strangeprod(this.A[i][k],this.A[k][j]));
            }
        }
    }
    for(i=0;i<this.nbrows; i++){
        for(j=0;j<this.nbcols; j++){
            this.A[i][j]=B[i][j];
        }
    }
};

Matrix.prototype.multiplyby=function(B){
    var i,j,k;
    var C=new Matrix(this.nbrows,B.nbcols);
    for (i=0;i<this.nbrows;i++){
        for (j=0;j<B.nbcols;j++){
            C.A[i][j]=bigInt.zero;
            for (k=0;k<this.nbcols;k++){
                C.A[i][j]=bigInt(C.A[i][j]).add(bigInt(this.A[i][k]).times(bigInt(B.A[k][j])));
            }
        }
    }
    return C;
}

Matrix.prototype.isAntisymmetric=function(){
    if (this.nbrows!==this.nbcols){return false;}
    var z=true;
    for (var i=0;i<this.nbrows;i++){
        for (var j=i;j<this.nbcols;j++){
            var Aijm=bigInt(this.A[i][j].times(bigInt.minusOne));
            if (bigInt(Aijm).compare(bigInt(this.A[j][i]))!==0){
                z=false;
            }
        }
    }
    return z;
}

makeBigInteger=function(D){
    var fact=bigInt.one;
    var b1, b2, fp;
    for (var i=0;i<D.length;i++){
        fp=D[i]-Math.floor(D[i]);
        if (fp>0.001){
            b1=bigInt(""+Math.round(1/fp));
            b2=bigInt.gcd(b1,fact);
            fact=bigInt(fact).multiply(b1).divide(b2);
        }
    }
    var Dint=[];
    for (i=0;i<D.length;i++){
        Dint.push(bigInt(""+Math.round(fact*D[i])));
    }
    return Dint;
};


markbranch=function(M, i, D){
    var x;
    //console.log("M.nbrows="+M.nbrows);
    for (var j=0; j<M.nbrows; j++){
        //console.log("j="+j+" D[j]="+D[j]+" M.A[i][j]="+M.A[i][j]+" M.A[j][i]="+M.A[j][i]);
        if ((D[j]==null)&&(bigInt(M.A[i][j]).compare(bigInt.zero)!==0)){
            x=-bigInt(M.A[i][j])/bigInt(M.A[j][i]);
            console.log("j="+j+" x="+x);
            D[j]=D[i]*x;
            markbranch(M, j, D);
        }
    }
};


antisymmetrizingDiag=function(M){
    var n=M.nbrows;
    var D=[];
    var i;
    for (i=0;i<n;i++){D.push(null);}
    var nullfound=false;
    i=0;
    var firstnull=0;
    while (firstnull<n){
        D[firstnull]=1;
        markbranch(M,firstnull,D);
        firstnull=0;
        i=0;
        nullfound=false;
        while ((i<n)&&(!nullfound)){
            firstnull++;
            i++;
            if (i>=n){
                nullfound=false;
            }
            else {
                nullfound=(D[i]==null);
            }
        }
    }
    var Dint=makeBigInteger(D);
    var Dia=new Matrix(n,n);
    for (i=0;i<n;i++){Dia.A[i][i]=Dint[i];}
    var P=Dia.multiplyby(M);
    if (!P.isAntisymmetric()){
        Dia=null;
    }
    return Dia;
};


function Quiver(nbpoints,qd){
    this.nbpoints=nbpoints;
    this.P=[];
    this.M=new Matrix(nbpoints,nbpoints);
    this.growthFactor=0.2;
    this.qd=qd;
    this.Hist=new History(qd);
    this.showFrozenVertices=true;
}

Quiver.prototype.permuteNodes=function(perm){
    this.M.permuteRowsCols(perm,perm);
    var Q=[];
    for (var i=0;i<this.nbpoints;i++){
        this.P[perm[i]].nber=i;
        Q.push(this.P[perm[i]]);
    }
    this.P=Q;
};

Quiver.prototype.addnode=function(Pt){
    this.P.push(Pt);
    var newM=new Matrix(this.M.nbrows+1,this.M.nbcols+1);
    newM.copyFrom(this.M);
    this.nbpoints++;
    this.M=newM;
};

Quiver.prototype.updateNodeLabels=function(){
    for (var i=0;i<this.nbpoints;i++){
        this.P[i].nber=i;
    }
};

Quiver.prototype.deletenode=function(k){
    var newP=[];
    for (var i=0;i<this.P.length;i++){
        if (i!==k){
            newP.push(this.P[i]);
        }
    }
    this.P=newP;
    this.M=this.M.omitRowCol(k);
    this.nbpoints--;
    this.updateNodeLabels();
};


Quiver.prototype.addarrow=function(i,j){
    this.M.A[i][j]=bigInt(this.M.A[i][j]).add(bigInt.one);
    this.M.A[j][i]=bigInt(this.M.A[j][i]).add(bigInt.minusOne);
};

Quiver.prototype.addvaluedarrow=function(i,j,v1,v2){
    this.M.A[i][j]=bigInt(v1);
    this.M.A[j][i]=bigInt(v2).times(bigInt.minusOne);
};

Quiver.prototype.addFraming=function(){
    var tx, ty, x,y,orignbpoints;
    tx=40;
    ty=40;
    orignbpoints=this.nbpoints;
    for (var q=0;q<orignbpoints;q++){
        x=this.P[q].x;
        y=this.P[q].y;
        var Pt=new MoveablePoint(x+tx,y+ty,orignbpoints+q,this.qd);
        this.addnode(Pt);
        this.P[this.nbpoints-1].frozen=true;
    }
    for (var q=0; q<orignbpoints; q++){
        this.M.A[q][q+orignbpoints]=bigInt.one;
        this.M.A[q+orignbpoints][q]=bigInt.minusOne;
    }
};

Quiver.prototype.mutate=function(k){
    this.M.mutate(k);
};

Quiver.prototype.hitPoint=function(x,y){
    var foundPoint=null;
    for (var i=0;i<this.nbpoints;i++){
        if (this.P[i].contains(x,y)){
            foundPoint=this.P[i];
        }
    }
    return foundPoint;
}

Quiver.prototype.updateTrafficLights=function(){
    if (!this.trafficLights){
        return;}
    for (var i=0; i<this.nbpoints; i++){
        if (!this.P[i].frozen){
            this.P[i].color="green";
        }
    }
    for (var i=0; i<this.nbpoints; i++){
        if (this.P[i].frozen){
            for (var j=0; j<this.nbpoints; j++){
                if (bigInt(this.M.A[i][j]).compare(bigInt.zero)>0){
                    this.P[j].color="red";
                }
            }
        }
    }
};

Quiver.prototype.draw=function(ctx){
    var P1, Q1, i, j, str;
    this.updateTrafficLights();
    for(var i=0;i<this.M.nbrows;i++){
        for(var j=i+1;j<this.M.nbcols;j++){
            var drawArrow=true;
            if (this.showFrozenVertices){
                drawArrow=!((this.P[i].frozen)&&(this.P[j].frozen));
            }
            else {
                drawArrow=!this.P[i].frozen&&!this.P[j].frozen;
            }
            if (drawArrow){
                if(this.M.A[i][j] >0){
                    P1={x:this.P[i].x, y:this.P[i].y};
                    Q1={x:this.P[j].x, y:this.P[j].y};
                    drawarrow(P1,Q1, this.P[j].radius,ctx);
                }
                if(this.M.A[i][j] <0){
                    P1={x:this.P[j].x, y:this.P[j].y};
                    Q1={x:this.P[i].x, y:this.P[i].y};
                    drawarrow(P1,Q1, this.P[j].radius,ctx);
                }
            }
        }
    }
    for(i=0;i<this.M.nbrows;i++){
        for(j=i+1;j<this.M.nbcols;j++){
            var drawArrow=true;
            if (this.showFrozenVertices){
                drawArrow=!((this.P[i].frozen)&&(this.P[j].frozen));
            }
            else {
                drawArrow=!this.P[i].frozen&&!this.P[j].frozen;
            }
            if (drawArrow){
                var needlabel=false;
                var v1=bigInt(this.M.A[i][j]).abs();
                var v2=bigInt(this.M.A[j][i]).abs();
                needlabel=((bigInt(v1).compare(bigInt.one)>0)||(bigInt(v2).compare(bigInt.one)>0));
                if (needlabel){
                    var equality=bigInt(v1).equals(bigInt(v2));
                    if (equality){
                        str=bigInt(v1).toString();
                    }
                    else {
                        if (sign(this.M.A[i][j])>0){
                            str=bigInt(v1).toString()+","+bigInt(v2).toString();
                        }
                        else {
                            str=bigInt(v2).toString()+","+bigInt(v1).toString();
                        }
                    }
                    ctx.font="14px Arial";
                    var w=1.2*ctx.measureText(str).width;
                    var h=20;
                    var tx =  0.5*this.P[j].x + 0.5*this.P[i].x;
                    var ty =  0.5*this.P[j].y + 0.5*this.P[i].y;
                    tx=tx-w/2;
                    ty=ty-h/2;

                    ctx.beginPath();
                    ctx.fillStyle="white";
                    ctx.fillRect(tx,ty,w,h);
                    ctx.fillStyle="black";
                    ctx.fillText(str, tx, ty+0.75*h);
                }
            }
        }
    }
    for (var i=0;i<this.nbpoints;i++){
        ctx.beginPath();
        if (!this.P[i].frozen||this.showFrozenVertices){
            this.P[i].draw(ctx,i+1);
        }
    }
};

Quiver.prototype.strictEnclosingRectangle=function(){
    var i;
    var xmin,xmax,ymin,ymax,x,y;

    if (this.nbpoints==0){
        xmin=0;
        xmax=10;
        ymin=0;
        ymax=10;
    }
    else {
        xmin=this.P[0].x;
        xmax=xmin;
        ymin=this.P[0].y;
        ymax=ymin;
        for (i=1;i<this.nbpoints; i++){
            x=this.P[i].x;
            y=this.P[i].y;
            if (x<=xmin){xmin=x;}
            if (x>xmax){xmax=x;}
            if (y<ymin){ymin=y;}
            if (y>ymax){ymax=y;}
        }
    }
    //System.out.println("xmin:"+xmin+ " xmax:"+xmax + " ymin"+ymin +" ymax:"+ymax);
    //Rectangle r= new Rectangle( (int) xmin, (int) ymin, (int) (xmax-xmin), (int) (ymax-ymin));
    return {x:xmin, y:ymin, width:xmax-xmin, height:ymax-ymin};
};

Quiver.prototype.enclosingRectangle=function(){
    var r= this.strictEnclosingRectangle();
    r.x=r.x-25;
    r.y=r.y-25;
    r.width=r.width+50;
    r.height=r.height+50;
    return r;
};

Quiver.prototype.scaleCenter=function(r2){
    var h1, h2, w1, w2, cw, ch, c, tx, ty;
    var Pt;
    var r1;
    var i;

    r1=this.enclosingRectangle();
    var horGrowth=r1.width*this.growthFactor;
    var vertGrowth=r1.height*this.growthFactor;
    r1.x=r1.x-horGrowth;
    r1.y=r1.y-vertGrowth;
    r1.width=r1.width+2*horGrowth;
    r1.height=r1.height+2*vertGrowth;

    h1=r1.height;
    h2=r2.height;
    w1=r1.width;
    w2=r2.width;

    if ((h2>10)&&(w2>10)){
        ch=h2/h1;
        cw=w2/w1;

        if (ch<=cw){c=ch;} else{c=cw;}
        tx=r2.x+r2.width/2-c*(r1.x+r1.width/2);
        ty=r2.y+r2.height/2-c*(r1.y+r1.height/2);

        var x,y;
        for (i=0; i<this.nbpoints; i++){
            x=this.P[i].x;
            y=this.P[i].y;
            x=c*x+tx;
            y=c*y+ty;
            this.P[i].moveTo(x,y);
        }
    }
};

Quiver.prototype.relax=function(edgelength,width,height){
    var boundexists=false;
    for (var i=0;i<this.nbpoints;i++){
        for (var j=i+1;j<this.nbpoints;j++){
            boundexists=(bigInt(this.M.A[i][j]).compare(bigInt.zero)!==0);
            if (boundexists){
                var vx=this.P[j].x-this.P[i].x;
                var vy=this.P[j].y-this.P[i].y;
                var len=Math.sqrt(vx*vx+vy*vy);
                len= (len==0) ? 0.0001 : len;
                var f=(edgelength-len)/(len*3);
                var dx=f*vx;
                var dy=f*vy;
                this.P[j].dx+=dx;
                this.P[j].dy+=dy;
                this.P[i].dx+=-dx;
                this.P[i].dy+=-dy;
            }
        }
    }
    for (var i=0;i<this.nbpoints; i++){
        var P1=this.P[i];
        var dx=0
        var dy=0;
        for (var j=0;j<this.nbpoints; j++){
            if (i==j){continue;}
            var P2=this.P[j];
            var vx=P1.x-P2.x;
            var vy=P1.y-P2.y;
            var len=vx*vx+vy*vy;
            if (len==0){
                dx+=Math.random();
                dy+=Math.random();
            }
            else if (len<10000){
                dx += vx/len;
                dy += vy/len;
            }
        }
        var dlen=dx*dx+dy*dy;
        if (dlen>0){
            dlen=Math.sqrt(dlen)/2;
            P1.dx += dx/dlen;
            P1.dy += dy/dlen;
        }
    }
    for (var i=0;i<this.nbpoints;i++){
        if (this.P[i].frozen){
            continue;
        }
        var P1=this.P[i];
        var x=P1.x+Math.max(-5, Math.min(5,P1.dx));
        var y=P1.y+Math.max(-5, Math.min(5,P1.dy));
        if (x<0){
            x=0;
        }
        else if (x>width){
            x=width;
        }
        if (y<0){
            y=0;
        }
        else if (y>height){
            y=height;
        }
        P1.moveTo(x,y);
        P1.dx /= 2;
        P1.dy /= 2;
    }
    this.qd.repaint();
};

function nb(k,m){return (k*(k+1)/2+m);}

function GLSQuiver(param,qd){
    var nbpoints=nb(param-1, param-1)+1;
    Q=new Quiver(nbpoints,qd);
    var cter=0;
    for (var i=0; i<param; i++){
        for (j=0; j<=i; j++){
            k=nb(i,j);
            var Pt=new MoveablePoint(30*(param-i-1+2*j), 50*i,cter,qd);
            cter++;
            Q.P.push(Pt);
            if ((j <= i-1) && (i >=1)){
                //System.out.println("k="+k+" nb("+(i-1)+","+j+")="+nb(i-1,j));
                m=nb(i-1,j);
                Q.M.A[k][m]=bigInt.one;
                Q.M.A[m][k]=bigInt.minusOne;}
            if(j-1>=0){
                //System.out.println("k="+k+" nb("+i+","+j+")="+nb(i,j-1));
                m=nb(i,j-1);
                Q.M.A[k][m]=bigInt.one;
                Q.M.A[m][k]=bigInt.minusOne;}
            if(i+1<param){
                //System.out.println("k="+k+" nb("+(i+1)+","+(j+1)+")="+nb(i+1,j+1));
                m=nb(i+1,j+1);
                Q.M.A[k][m]=bigInt.one;
                Q.M.A[m][k]=bigInt.minusOne;}
        }
    }
    return Q;
}

function History(qd){
    this.qd=qd;
    this.history=[];
    this.historycounter=-1;
}

History.prototype.reset=function(){
    this.history=[];
    this.historycounter=-1;
    this.updatebuttons();
};

History.prototype.updatebuttons=function(){
    this.qd.updatehistorybuttons(this.historycounter, this.history.length);
};

History.prototype.show=function(){
    alert(this.toString());
};

History.prototype.toString=function(){
    var str="";
    if (this.history.length>0){
        str=str+(1+this.history[0]);
    }
    for (var i=1;i<this.history.length;i++){
        str=str+","+(1+this.history[i]);
    }
    return str;
};

History.prototype.add=function(i){
    if (this.historycounter<this.history.length-1){
        this.history.length=this.historycounter+1;
    }
    this.history.push(i);
    this.historycounter++;
    this.updatebuttons();
};

History.prototype.present=function(){
    if (this.historycounter<0){
        return -1;
    }
    else {
        return this.history[this.historycounter];
    }
};

History.prototype.next=function(){
    if (this.historycounter>this.history.length-2){
        return -1;
    }
    else {
        return this.history[this.historycounter+1];
    }
};

History.prototype.back=function(){
    if (this.historycounter<0){
        return -1;
    }
    else {
        var hc=this.historycounter;
        this.historycounter--;
        this.updatebuttons();
        return this.history[hc];
    }
};

History.prototype.forward=function(){
    if (this.historycounter>this.history.length-2){
        return -1;
    }
    else {
        this.historycounter++;
        this.updatebuttons();
        return this.history[this.historycounter];
    }
};

function MoveablePoint(x,y,nber, quiverdrawing){
    this.x=x;
    this.y=y;
    this.nber=nber;
    this.radius=9;
    this.label=null;
    this.frozen=false;
    this.marked=false;
    this.color="red";
    this.dx=0;
    this.dy=0;
    this.qd=quiverdrawing;
    this.tag = goog.dom.createDom('div', {'style': 'position:absolute; cursor: pointer;'}, null);
    this.tag.style.height=2*this.radius;
    this.tag.style.width=2*this.radius;
    this.tag.style.left=(this.x-this.radius)+"px";
    this.tag.style.top=(this.y-this.radius)+"px";
    //this.tag.point=this;

    var canvas=quiverdrawing.canvas;
    var div=quiverdrawing.div;
    goog.dom.appendChild(div,this.tag);
    var width=parseInt(div.style.width, 10);
    var height=parseInt(div.style.height,10);
    var draglimits=new goog.math.Rect(0,0,width-2*this.radius, height-2*this.radius);
    this.drag=new goog.fx.Dragger(this.tag, null,draglimits);

    goog.events.listen(this.drag,'start',this.onstart,true,this);
    goog.events.listen(this.drag,'drag',this.ondrag,true,this);
    goog.events.listen(this.drag,'end',this.onend,true,this);
    goog.events.listen(this.tag,'click',this.onclick,true,this);

    this.mousedowntime=0;
    this.mouseuptime=0;
};

MoveablePoint.prototype.onstart=function(e){
    this.mousedowntime=Date.now();
};

MoveablePoint.prototype.onend=function(e){
    this.mouseuptime=Date.now();
};

MoveablePoint.prototype.onclick=function(e){
    this.qd.clickhandled=true;
    if (this.mouseuptime-this.mousedowntime>300){
        return;
    }
    var mouse=this.qd.getMouse(e);
    this.qd.clickedPoint(this.nber);
};

MoveablePoint.prototype.ondrag=function(e){
    this.x=this.drag.limitX(this.drag.deltaX) + this.radius;
    this.y=this.drag.limitY(this.drag.deltaY) + this.radius;
    this.qd.repaint();
};

MoveablePoint.prototype.moveTo=function(x,y){
    this.x=x;
    this.y=y;
    this.tag.style.left=(x-this.radius)+"px";
    this.tag.style.top=(y-this.radius)+"px";
};


MoveablePoint.prototype.toString=function(){
    return "x: "+this.x+" y: "+this.y;
};

MoveablePoint.prototype.draw = function(ctx,content){
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,2*Math.PI);
    if (this.marked){
        ctx.fillStyle="yellow";
    }
    else {
        if (this.frozen){
            ctx.fillStyle="blue";
        }
        else {
            ctx.fillStyle = this.color;
        }
    }
    ctx.fill();
    ctx.lineWidth=2;
    ctx.strokeStyle = "black";
    ctx.stroke();
    var width=ctx.measureText(content).width;
    ctx.fillStyle = "black";
    ctx.font="14px Arial";
    ctx.fillText(content,this.x-width/2-1, this.y+6);
    if (this.label!=null){
        var w=2*ctx.measureText(this.label).width;
        var h=18;
        var tx=this.x+1.5*this.radius;
        var ty=this.y-1.5*this.radius;
        tx=tx-w/2;
        ty=ty-h/2;
        ctx.fillStyle="white";
        ctx.fillRect(tx,ty,w,h);
        ctx.fillStyle="black";
        ctx.fillText(this.label, tx+w/4, ty+0.75*h);
    }
};


MoveablePoint.prototype.toggleFreeze=function(){
    this.frozen=!this.frozen;
};

function QuiverDrawing(canvas,div){
    goog.style.setUnselectable(canvas, true);
    goog.style.setUnselectable(div,true);
    this.canvas=canvas;
    this.div=div;
    this.ctx = canvas.getContext('2d');
    this.width=canvas.width;
    this.height=canvas.height;
    this.Q=GLSQuiver(4,this);
    var r={x:0,y:0,width:canvas.width,height:canvas.height};
    this.Q.scaleCenter(r);
    this.status=MUTATING;
    this.clickhandled=false;
    goog.events.listen(div,'click',this.onclick,false,this);
    this.init();
}

QuiverDrawing.prototype.onclick=function(e){
    var qd=this;
    if (qd.clickhandled){
        qd.clickhandled=false;
        return;
    }
    var mouse = qd.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;
    if (qd.status==ADD_NODES){
        var Pt=new MoveablePoint(mx,my,qd.Q.nbpoints,qd);
        qd.Q.addnode(Pt);
        qd.repaint();
    }
};

QuiverDrawing.prototype.clickedPoint=function(i){
    var qd=this;
    switch (qd.status){
        case MUTATING:
            qd.Q.mutate(i);
            qd.Q.Hist.add(i);
            qd.Q.Hist.updatebuttons();
            qd.repaint();
            break;
        case WAIT_FOR_NEW_SOURCE:
            qd.sourceindex=i;
            qd.updatestatus(WAIT_FOR_NEW_TARGET);
            break;
        case WAIT_FOR_NEW_TARGET:
            qd.Q.addarrow(qd.sourceindex,i);
            qd.repaint();
            qd.updatestatus(WAIT_FOR_NEW_SOURCE);
            break;
        case DEL_NODES:
            qd.Q.deletenode(i);
            qd.repaint();
            break;
        case FREEZE_NODES:
            qd.Q.P[i].toggleFreeze();
            qd.repaint();
            break;
        case WAIT_FOR_NEW_VSOURCE:
            qd.sourceindex=i;
            qd.updatestatus(WAIT_FOR_NEW_VTARGET);
            break;
        case WAIT_FOR_NEW_VTARGET:
            var str=prompt("Enter valuation in the format a b :","1 1");
            if (str!==null){
                var arr=str.split(" ");
                var v1=parseInt(arr[0],10);
                var v2=parseInt(arr[1],10);
                console.log("v1="+v1+"v2="+v2);
                qd.Q.addvaluedarrow(qd.sourceindex,i, v1, v2);
                console.log("Arrow added to Q. Computing antisymmetrizer");
                console.log("Matrix:\n");
                console.log(qd.Q.M);
                var D=antisymmetrizingDiag(qd.Q.M);
                if (D==null){
                    alert("Warning: This valued quiver does not correspond to " +
                        "an antisymmetrizable matrix!");
                }
                qd.repaint();
            }
            qd.updatestatus(WAIT_FOR_NEW_VSOURCE);
            break;
        case WAIT_FOR_NEXT_NODE:
            if (!qd.Q.P[i].marked){
                qd.Q.P[i].marked=true;
                qd.Q.P[i].label=""+(qd.nodenber+1);
                qd.nodeseq.push(i);
                qd.nodenber++;
            }
            if (qd.nodenber==qd.Q.nbpoints){
                for (var i=0;i<qd.Q.nbpoints;i++){
                    qd.Q.P[i].marked=false;
                    qd.Q.P[i].label=null;
                }
                qd.Q.permuteNodes(qd.nodeseq);
                qd.updatestatus(MUTATING);
            }
            else {
                qd.updatestatus(WAIT_FOR_NEXT_NODE);
            }
            qd.repaint();
            break;
    }
}

QuiverDrawing.prototype.repaint=function(){
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.Q.draw(this.ctx);
};

QuiverDrawing.prototype.getMouse = function(e) {
    var target = e.target || e.srcElement;
    var rect = target.getBoundingClientRect();
    mx = e.clientX-rect.left;
    my = e.clientY-rect.top;
    return {x: mx, y: my};
};


QuiverDrawing.prototype.updatestatus=function(st){
    this.status=st;
    switch (st){
        case MUTATING:
            this.statusLine.textContent="Click or drag nodes"; break;
        case ADD_NODES:
            statusLine.textContent="Click to create new nodes"; break;
        case WAIT_FOR_NEW_SOURCE:
            statusLine.textContent="Click on source of new arrow or press Done"; break;
        case WAIT_FOR_NEW_TARGET:
            statusLine.textContent="Click on target of new arrow or press Done"; break;
        case DEL_NODES:
            statusLine.textContent="Click on node to delete or press Done"; break;
        case FREEZE_NODES:
            statusLine.textContent="Click on node to (un)freeze or press Done"; break;
        case WAIT_FOR_NEW_VSOURCE:
            statusLine.textContent="Click on source of new valued arrow or press Done"; break;
        case WAIT_FOR_NEW_VTARGET:
            statusLine.textContent="Click on target of new valued arrow or press Done"; break;
        case WAIT_FOR_NEXT_NODE:
            statusLine.textContent="Click on new node number "+(this.nodenber+1)+ ". Click Done to cancel."
    }
}

QuiverDrawing.prototype.updatehistorybuttons=function(cter,size){
    if (cter>-1){
        this.backButton.disabled=false;
    }
    else {
        this.backButton.disabled=true;
    }
    if (cter<size-1){
        this.forwardButton.disabled=false;
    }
    else {
        this.forwardButton.disabled=true;
    }
};

QuiverDrawing.prototype.setStatusLine=function(sl){
    this.statusLine=sl;
};

QuiverDrawing.prototype.setBackButton=function(bb){
    this.backButton=bb;
    var qd=this;
    bb.addEventListener('mousedown',function(e){
        console.log("Back button pressed");
        var mutvert=qd.Q.Hist.back();
        console.log("mutvert="+mutvert);
        if (mutvert>-1){
            qd.Q.mutate(mutvert);
            qd.repaint();
        }
    }, true);
};

QuiverDrawing.prototype.setForwardButton=function(fb){
    this.forwardButton=fb;
    var qd=this;
    fb.addEventListener('mousedown', function(e){
        var mutvert=qd.Q.Hist.forward();
        if (mutvert>-1){
            qd.Q.mutate(mutvert);
            qd.repaint();
        }
    }, true);
};

QuiverDrawing.prototype.setNewQuiverButton=function(bt){
    var qd=this;
    bt.addEventListener('mousedown', function(e){
        var n=prompt("Enter side length","4");
        if (n!==null){
            if ((1<=n)&&(n<=100)){
                qd.Q=GLSQuiver(n,qd);
                var r={x:0,y:0,width:qd.width,height:qd.height};
                qd.Q.scaleCenter(r);
                qd.Q.Hist.updatebuttons();
                qd.repaint();
            }
        }
    }, true);
};

QuiverDrawing.prototype.setAddNodesButton=function(bt){
    var qd=this;
    bt.addEventListener('mousedown', function(e){
        qd.updatestatus(ADD_NODES);
    }, true);
};

QuiverDrawing.prototype.setAddArrowsButton=function(bt){
    var qd=this;
    bt.addEventListener('mousedown', function(e){
        qd.updatestatus(WAIT_FOR_NEW_SOURCE);
    }, true);
};

QuiverDrawing.prototype.setDeleteNodesButton=function(bt){
    var qd=this;
    bt.addEventListener('mousedown', function(e){
        qd.updatestatus(DEL_NODES);
    }, true);
};

QuiverDrawing.prototype.setFreezeNodesButton=function(bt){
    var qd=this;
    bt.addEventListener('mousedown', function(e){
        qd.updatestatus(FREEZE_NODES);
    }, true);
};

QuiverDrawing.prototype.setAddValuedArrowsButton=function(bt){
    var qd=this;
    bt.addEventListener('mousedown', function(e){
        qd.updatestatus(WAIT_FOR_NEW_VSOURCE);
    }, true);
};

QuiverDrawing.prototype.setLiveQuiverButton=function(bt){
    this.liveQuiverButton=bt;
    var qd=this;
    bt.addEventListener('mousedown', function(e){
        if (qd.liveQuiverButton.textContent=="Live quiver"){
            qd.liveQuiverButton.textContent="Static quiver";
            qd.intervalID=window.setInterval(function(){qd.Q.relax(75, qd.width, qd.height);}, 100);
        }
        else {
            qd.liveQuiverButton.textContent="Live quiver";
            window.clearInterval(qd.intervalID);
        }
    }, true);
};

QuiverDrawing.prototype.setRenumberButton=function(bt){
    var qd=this;
    bt.addEventListener('mousedown', function(e){
        qd.nodenber=0;
        qd.nodeseq=[];
        qd.updatestatus(WAIT_FOR_NEXT_NODE);
    }, true);
};

QuiverDrawing.prototype.setHistoryButton=function(bt){
    var qd=this;
    bt.addEventListener('mousedown',function(e){
        alert("History: "+qd.Q.Hist.toString());
    }, true);
};

QuiverDrawing.prototype.setRandomButton=function(bt){
    var qd=this;
    qd.randnber=15;
    bt.addEventListener('mousedown',function(e){
        var str=prompt("Enter number of randum mutations", qd.randnber);
        if (str!==null){
            qd.randnber=parseInt(str);
            var redVertices=[];
            for (var j=0;j<qd.Q.nbpoints;j++){
                if (!qd.Q.P[j].frozen){
                    redVertices.push(j);
                }
            }
            for (var i=0;i<qd.randnber;i++){
                var j=Math.floor((Math.random() * redVertices.length));
                var r=redVertices[j];
                qd.Q.mutate(r);
                qd.Q.Hist.add(r);
            }
        }
        qd.repaint();
    },true);
};

QuiverDrawing.prototype.setRepeatRandomButton=function(bt){
    var qd=this;
    bt.addEventListener('mousedown',function(e){
        var redVertices=[];
        for (var j=0;j<qd.Q.nbpoints;j++){
            if (!qd.Q.P[j].frozen){
                redVertices.push(j);
            }
        }
        for (var i=0;i<qd.randnber;i++){
            var j=Math.floor((Math.random() * redVertices.length));
            var r=redVertices[j];
            qd.Q.mutate(r);
            qd.Q.Hist.add(r);
        }
        qd.repaint();
    },true);
};

QuiverDrawing.prototype.setAddFramingButton=function(bt){
    var qd=this;
    bt.addEventListener('mousedown',function(e){
        qd.Q.addFraming();
        qd.Q.trafficLights=true;
        qd.repaint();
    },true);
};

QuiverDrawing.prototype.setHideFrozenButton=function(bt){
    var qd=this;
    this.showFrozenVertices=true;
    this.hideFrozenButton=bt;
    bt.addEventListener('mousedown',function(e){
        if (qd.Q.showFrozenVertices){
            qd.Q.showFrozenVertices=false;
            qd.hideFrozenButton.textContent="Show frozen";
        }
        else {
            qd.Q.showFrozenVertices=true;
            qd.hideFrozenButton.textContent="Hide frozen";
        }
        qd.repaint();
    },true);
};

QuiverDrawing.prototype.setCenterButton=function(bt){
    var qd=this;
    bt.addEventListener('mousedown', function(e){
        var r={x:0,y:0,width:qd.width,height:qd.height};
        console.log(r);
        qd.Q.scaleCenter(r);
        qd.repaint();
    }, true);
};


QuiverDrawing.prototype.setDoneButton=function(bt){
    this.doneButton=bt;
    var qd=this;
    bt.addEventListener('mousedown', function(e){
        if (qd.status=WAIT_FOR_NEXT_NODE){
            for (var i=0;i<qd.Q.nbpoints;i++){
                qd.Q.P[i].marked=false;
                qd.Q.P[i].label=null;
            }
        }
        qd.updatestatus(MUTATING);
        qd.repaint();
    }, true);
};

QuiverDrawing.prototype.init=function() {
    this.setStatusLine(document.getElementById('statusLine'));
    this.setBackButton(document.getElementById('backButton'));
    this.setForwardButton(document.getElementById('forwardButton'));
    this.Q.Hist.updatebuttons();
    this.setNewQuiverButton(document.getElementById('newQuiverButton'));
    this.setAddNodesButton(document.getElementById('addNodesButton'));
    this.setAddArrowsButton(document.getElementById('addArrowsButton'));
    this.setDeleteNodesButton(document.getElementById('deleteNodesButton'));
    this.setFreezeNodesButton(document.getElementById('freezeNodesButton'));
    this.setAddValuedArrowsButton(document.getElementById('addValuedArrowsButton'));
    this.setLiveQuiverButton(document.getElementById('liveQuiverButton'));
    this.setRenumberButton(document.getElementById('renumberButton'));
    this.setHistoryButton(document.getElementById('historyButton'));
    this.setRandomButton(document.getElementById('randomButton'));
    this.setRepeatRandomButton(document.getElementById('repeatRandomButton'));
    this.setDoneButton(document.getElementById('doneButton'));
    this.setAddFramingButton(document.getElementById('addFramingButton'));
    this.setHideFrozenButton(document.getElementById('hideFrozenButton'));
    this.setCenterButton(document.getElementById('centerButton'));
    this.repaint();
};

goog.exportSymbol('QuiverDrawing', QuiverDrawing);


