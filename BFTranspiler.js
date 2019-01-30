/**Given pseudocode, convert it to BF and output that code
 * @param code The pseudocode to translate
 * @param reg Optional paramater that contains any existing registers
 * @param p Optional parameter containing any procedures previously defined
 * @param checked A boolean representing whether input has already been properly parsed
 */
function kcuf(code, reg=[], p=[], checked=false) {
  var r='', c=code;//return String of translated code in r, c is shortening of code
  //due to its frequent use
  if(!checked)
  {
    for(var i=c.indexOf(" ["); i>0; i=c.indexOf(" ["))
      c=c.substring(0, i)+c.substring(i+1);//square brackets do not need spaces!
    for(var i=c.indexOf("[ "); i>0; i=c.indexOf("[ "))
      c=c.substring(0, i+1)+c.substring(i+2);
    for(var i=c.indexOf(" ]"); i>0; i=c.indexOf(" ]"))
      c=c.substring(0, i)+c.substring(i+1);//so smush them so "a  [ 20 ]" becomes "a[20]"
    c=c.replace(/  /g, " ").replace(/\t/g, "").split("\n");
    //get rid of all double spaces, tabs, and split each line of code into its own index
    for(var i=0; i<c.length; i++)//go through each line of code
    {
      var n=[], j, t;//new line of code, index to keep track of the end of a token
      //and a temporary value for general use
      while(c[i].length)//while there is code on this line to parse through
        if(c[i][0]==' ')//each token will be an element
          c[i]=c[i].substring(1);//so spaces may be discarded
        else if(c[i][0]=='"')//beginning of literal text token found
        {
          for(j=1; c[i][j]!='"'&&j<c[i].length; j++){}//find the corresponding "
          if(c[i][j]!='"')//if we didn't find another double quote
            throw "Not enough quotes!";//then we have an unclosed String literal!
          n.push(c[i].substring(0, ++j));//push the String with quotes
          c[i]=c[i].substring(j);//and delete the old token so it doesn't get re-parsed
        }
        else if(c[i][0]=="#"||c[i].startsWith("//")||c[i].startsWith("--"))//all comment indicators
          c[i]='';//ignore the rest of the line
        else//not a string literal or comment, token must be parsed in a unique way
        {
          for(j=1; j<c[i].length&&'" #/-'.indexOf(c[i][j])<0; j++){}//go until we find
          //a double quote (start of string), space, or comment
          n.push(c[i].substring(0, j));//add the new token
          c[i]=c[i].substring(j);//don't re-parse it!
        }
      if(n.length&&n[0].toLowerCase()!='rem')//rem is ANOTHER form of comment
      {
        n[0]=n[0].toLowerCase();//commands should be lowercase
        c[i]=n;//replace the original line of code with the newfound tokens
      }
      else//original line of code was empty or a comment, just get rid of it
        c.splice(i--, 1);
    }
    for(var i=0; i<c.length; i++)//time to find procedures!
      if(c[i][0]=='proc')//hey we found one
      {
        c[i][1]=c[i][1].toLowerCase();//all proc names will be lowercase for easier parsing
        for(var v of p)//go through existing procedures
          if(v[0][1]==c[i][1])//if we find one with the same name as ours
            throw "Duplicate proc!";
        p.push(c.splice(i, endEx(c, i)-i));//push the procedure since it's new
        c.splice(i--, 1);//and don't re-parse it later!
      }
    for(var i=0; i<p.length; i++)//go through all procedures
    {
      for(var j=2; j<p[i][0].length; j++)//then go through their parameters
      {
        p[i][0][j]=p[i][0][j].toUpperCase();//convert them to uppercase for easier comparing
        for(var k=2; k<j; k++)//go through every parameter before ours
          if(p[i][0][j]==p[i][0][k])//if it's duplicate, this is invalid!
            throw "Duplicate parameter names!";
      }
      if(p[i][0].length>2)//if there are any parameters
        procInsert(p, ['call', p[i][0][1], ...(p[i][0].slice(2).join("A ")+"A").split(" ")]);
        //then tack the letter "A" onto them to reduce the risk of proc parameter names
        //and register names clashing :)
    }
    for(var i=0; i<p.length; i++)//go through the procedures AGAIN (ugh...)
    {
      var b=true, k;//assume there's stuff to simplify
      while(b)//while there's stuff to simplify
      {
        b=false;
        for(var j=1; j<p[i].length; j++)//go through this proc's code
          if(p[i][0][1]==p[i][j][1]||p[i][j][0]=='var')//variables cannot be defined inside of procedures!
            throw "Bad proc!";
          else if(p[i][j][0]=='call')//uh oh, time to simplify!
          {
            k=procInsert(p, p[i][j]);//all "calls" are replaced with the actual proc code
            p[i].splice(j--, 1, ...p[k].slice(1));//so put that code in place of the call!
            b=true;//we did something, we better loop again later!
          }
      }
    }
  }
  for(var i=0; i<c.length; i++)//go through every line of code
  {
    if(c[i][0]=='msg')
    {
      var ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      //these are re-occuring themes in this project. In BF, the only valid commands ARE:
      //[]<>+-., so to get from register to register, we move the pointer to that register
      //do whatever we're gonna do to it, and then go back to the beginning so finding
      //another register later is easier.
      for(var j=1; j<c[i].length; j++)//go through all tokens
        if(c[i][j][0]=='"')//literal string found
        {
          r+=rl;//whenever we want a register we can completely screw around with, we go past
          //all existing registers, so ll and rl help us navigate to and from the end of regs
          for(var k=1, l=c[i][j].length-1; k<l; k++)//go through the literal text
          {
            r+="[-]";//zero out the dummy register
            if(c[i][j][k]=='\\'&&c[i][j][k+1]=='n')//newline found, it must be parsed specially
            {
              r+="++++++++++";// \n has charcode 10
              k++;//don't reparse the "n" in "\n"!
            }
            else
              r+="+".repeat(c[i][j].charCodeAt(k));//there are better ways to get to an arbitrary
              //number, but repeating "+" is the least tedious for a programmer
            r+='.';//output the current character
          }
          r+=ll;//go back to the beginning of registers
        }
        else//thing to print is a register
        {
          var a=reg.indexOf(c[i][j].toUpperCase());//find the index of the register in regs
          r+=">".repeat(a)+"."+"<".repeat(a);//go to it, print its value and restore the pointer to 0
        }
    }
    else if(c[i][0]=='var')//time to define new variables! :)
      for(var j=1; j<c[i].length; j++)//go through each var to define
      {
        c[i][j]=c[i][j].toUpperCase().split("[");//if it's a list, such as a[10], we want
        //a and 10 to be separated (we discard the extra "]" later)
        if(reg.includes(c[i][j][0])||!isNaN(c[i][j][0]))//no redefining variables or making
        //variables that are actually numbers!
          throw "Bad var name!";
        if(c[i][j].length==1)//not a list
          reg.push(c[i][j][0]);//simple!
        else//oh no a list ugh...
          if(c[i][j][1].indexOf("]")>0)//valid list
            for(var k=+c[i][j][1].split("]")[0]+4; k>0; k--)//lists are special: when we make
            //a list, we actually NEED four empty spots before it, hence the +4. additionally,
            //we need a space for each index of the register
              reg.push(c[i][j][0]);
          else//you forgot your ] buddy!
            throw "Unclosed [] pair!";
      }
    else if(c[i][0]=='read')//simple: read in a variable to a register
    {
      var n=reg.indexOf(c[i][1].toUpperCase());
      r+=">".repeat(n)+","+"<".repeat(n);//, is for reading input
    }
    else if(c[i][0]=='set')//set a register to a value (which might be another reg)
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase());
      var la="<".repeat(a), ra=">".repeat(a), ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      r+=ra+"[-]";//zero out 1st reg so it can be set
      if(b<0)//second arg is a number or character
        r+=plusString(c[i][2])+la;
      else//second arg is a register
      {
        var lb="<".repeat(b), rb=">".repeat(b);
        r+=la+rb+"["+lb+ra+"+"+la+rl+"+"+ll+rb+"-]"+lb+rl+"["+ll+rb+"+"+lb+rl+"-]"+ll;
      }
    }
    else if(c[i][0]=='inc')//increment a register by a number or character
    {
      var n=reg.indexOf(c[i][1].toUpperCase());
      r+=">".repeat(n)+plusString(c[i][2])+"<".repeat(n);
    }
    else if(c[i][0]=='dec')//same as inc
    {
      var n=reg.indexOf(c[i][1].toUpperCase());
      r+=">".repeat(n)+plusString(-c[i][2])+"<".repeat(n);
    }
    else if(c[i][0]=='add')//add two registers or numbers and put them in another register
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase()), d=reg.indexOf(c[i][3].toUpperCase());
      //we call registers a, b and d because "c" is the code
      var ld="<".repeat(d), rd=">".repeat(d), ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      r+=rl+"[-]"+ll;
      if(a<0)
        r+=rl+plusString(c[i][1])+ll;
      else
      {
        var la="<".repeat(a), ra=">".repeat(a);
        r+=ra+"["+la+rl+"+>+<"+ll+ra+"-]"+la+rl+">[<"+ll+ra+"+"+la+rl+">-]<"+ll;
      }
      if(b<0)
        r+=rl+plusString(c[i][2])+ll;
      else
      {
        var lb="<".repeat(b), rb=">".repeat(b);
        r+=rb+"["+lb+rl+"+>+<"+ll+rb+"-]"+lb+rl+">[<"+ll+rb+"+"+lb+rl+">-]<"+ll;
      }
      r+=rd+"[-]"+ld+rl+"["+ll+rd+"+"+ld+rl+"-]"+ll;
    }
    else if(c[i][0]=='sub')//subtract one reg from another, will eventually add number support
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase()), d=reg.indexOf(c[i][3].toUpperCase());
      var la="<".repeat(a), ra=">".repeat(a), lb="<".repeat(b), rb=">".repeat(b), lc="<".repeat(d), rc=">".repeat(d), ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      r+=rl+"[-]>[-]<"+ll+ra+"["+la+rl+"+>+<"+ll+ra+"-]"+la+rl+"["+ll+ra+"+"+la+rl+"-]"+ll;
      r+=rb+"["+lb+rl+"+>-<"+ll+rb+"-]"+lb+rl+"["+ll+rb+"+"+lb+rl+"-]";
      r+=ll+rc+"[-]"+lc+rl+">[<"+ll+rc+"+"+lc+rl+">-]<"+ll;
    }
    else if(c[i][0]=='mul')//multiply two registers, 5*6=5+5+5+5+5+5, so we use add concept in a loop
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase()), d=reg.indexOf(c[i][3].toUpperCase());
      var la="<".repeat(a), ra=">".repeat(a), lb="<".repeat(b), rb=">".repeat(b), lc="<".repeat(d), rc=">".repeat(d), ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      r+=rl+"[-]>[-]>[-]<<"+ll+ra+"["+la+rl+">>+<+<"+ll+ra+"-]"+la+rl+">[<"+ll+ra+"+"+la+rl+">-]>[<<"+ll;
      r+=rb+"["+lb+rl+"+>+<"+ll+rb+"-]"+lb+rl+"["+ll+rb+"+"+lb+rl+"-]>>-]<<";
      r+=ll+rc+"[-]"+lc+rl+">[<"+ll+rc+"+"+lc+rl+">-]<"+ll;
    }
    else if(c[i][0]=='divmod')//simultaneously computes div and mod of two regs and stores them in 2 regs
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase()), d=reg.indexOf(c[i][3].toUpperCase()), m=reg.indexOf(c[i][4].toUpperCase());
      var ld="<".repeat(d), rd=">".repeat(d), lm="<".repeat(m), rm=">".repeat(m), ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      r+=rl+"[-]>[-]>[-]>[-]>[-]>[-]>[-]>[-]<<<<<<<"+ll;//we need lots of empty temporary registers for convenience
      if(a<0)//registers can be numbers, must be stored in regs though
      {
        a=plusString(c[i][1]);
        r+=rl+">>>"+a+"<<<"+ll;
      }
      else
      {
        var la="<".repeat(a), ra=">".repeat(a);
        r+=ra+"["+la+rl+"+>>>+<<<"+ll+ra+"-]"+la+rl+"["+ll+ra+"+"+la+rl+"-]"+ll;
      }
      if(b<0)
      {
        b=plusString(c[i][2]);
        r+=rl+">"+b+">>>"+b+"<<<";
      }
      else
      {
        var lb="<".repeat(b), rb=">".repeat(b);
        r+=rb+"["+lb+rl+"+>+>>>+<<<<"+ll+rb+"-]"+lb+rl+">[<"+ll+rb+"+"+lb+rl+">-]";
      }//the actual divmod algorithm is below
      r+="+<-[>>>[->-[>+>>]>[+[-<+>]>+>>]<<<<<]<<-<[-]]>[>>[>>>+<<<-]<<-]<";
      r+=ll+rd+"[-]"+ld+rm+"[-]"+lm+rl+">>>>>>[<<<<<<"+ll+rd+"+"+ld+rl+">>>>>>-]<[<<<<<"+ll+rm+"+"+lm+rl+">>>>>-]<<<<<"+ll;
    }
    else if(c[i][0]=='div')//same as divmod, but just put mod somewhere we don't care about
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase()), d=reg.indexOf(c[i][3].toUpperCase()), m=reg.length;
      var ld="<".repeat(d), rd=">".repeat(d), lm="<".repeat(m), rm=">".repeat(m), ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      r+=rl+"[-]>[-]>[-]>[-]>[-]>[-]>[-]>[-]<<<<<<<"+ll
      if(a<0)
      {
        a=plusString(c[i][1]);
        r+=rl+">>>"+a+"<<<"+ll;
      }
      else
      {
        var la="<".repeat(a), ra=">".repeat(a);
        r+=ra+"["+la+rl+"+>>>+<<<"+ll+ra+"-]"+la+rl+"["+ll+ra+"+"+la+rl+"-]"+ll;
      }
      if(b<0)
      {
        b=plusString(c[i][2]);
        r+=rl+">"+b+">>>"+b+"<<<";
      }
      else
      {
        var lb="<".repeat(b), rb=">".repeat(b);
        r+=rb+"["+lb+rl+"+>+>>>+<<<<"+ll+rb+"-]"+lb+rl+">[<"+ll+rb+"+"+lb+rl+">-]";
      }//same algo from divmod
      r+="+<-[>>>[->-[>+>>]>[+[-<+>]>+>>]<<<<<]<<-<[-]]>[>>[>>>+<<<-]<<-]<";
      r+=ll+rd+"[-]"+ld+rm+"[-]"+lm+rl+">>>>>>[<<<<<<"+ll+rd+"+"+ld+rl+">>>>>>-]<[<<<<<"+ll+rm+"+"+lm+rl+">>>>>-]<<<<<"+ll;
    }
    else if(c[i][0]=='mod')//same as divmod
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase()), d=reg.length, m=reg.indexOf(c[i][3].toUpperCase());
      var ld="<".repeat(d), rd=">".repeat(d), lm="<".repeat(m), rm=">".repeat(m), ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      r+=rl+"[-]>[-]>[-]>[-]>[-]>[-]>[-]>[-]<<<<<<<"+ll
      if(a<0)
      {
        a=plusString(c[i][1]);
        r+=rl+">>>"+a+"<<<"+ll;
      }
      else
      {
        var la="<".repeat(a), ra=">".repeat(a);
        r+=ra+"["+la+rl+"+>>>+<<<"+ll+ra+"-]"+la+rl+"["+ll+ra+"+"+la+rl+"-]"+ll;
      }
      if(b<0)
      {
        b=plusString(c[i][2]);
        r+=rl+">"+b+">>>"+b+"<<<";
      }
      else
      {
        var lb="<".repeat(b), rb=">".repeat(b);
        r+=rb+"["+lb+rl+"+>+>>>+<<<<"+ll+rb+"-]"+lb+rl+">[<"+ll+rb+"+"+lb+rl+">-]";
      }
      r+="+<-[>>>[->-[>+>>]>[+[-<+>]>+>>]<<<<<]<<-<[-]]>[>>[>>>+<<<-]<<-]<";
      r+=ll+rd+"[-]"+ld+rm+"[-]"+lm+rl+">>>>>>[<<<<<<"+ll+rd+"+"+ld+rl+">>>>>>-]<[<<<<<"+ll+rm+"+"+lm+rl+">>>>>-]<<<<<"+ll;
    }
    else if(c[i][0]=='cmp')//compare two regs, number or characters
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase()), d=reg.indexOf(c[i][3].toUpperCase());
      var ll="<".repeat(reg.length), rl=">".repeat(reg.length), ld="<".repeat(d), rd=">".repeat(d);
      r+=rl+"[-]>[-]>[-]>[-]>[-]>[-]>[-]<<<<<<"+ll;
      if(a<0)
      {
        a=plusString(c[i][1]);
        r+=rl+">>>"+a+">>"+a+"<<<<<"+ll;
      }
      else
      {
        var la="<".repeat(a), ra=">".repeat(a);
        r+=ra+"["+la+rl+"+>>>+>>+<<<<<"+ll+ra+"-]"+la+rl+"["+ll+ra+"+"+la+rl+"-]"+ll;
      }
      if(b<0)
      {
        b=plusString(c[i][2]);
        r+=rl+">>>>"+b+">>"+b+"<<<<<<"+ll;
      }
      else
      {
        var lb="<".repeat(b), rb=">".repeat(b);
        r+=rb+"["+lb+rl+"+>>>>+>>+<<<<<<"+ll+rb+"-]"+lb+rl+"["+ll+rb+"+"+lb+rl+"-]"+ll;
      }//for cmp a b c, c will be 255 if a<b, 0 if a==b and 1 if a>b
      r+=rl+">>>[<<<+>>>>[-<<<<[-]>+>>>]<<<<[->>+<<]>[->>>+<<<]>>>-<-]";
      r+=">>[->-<]+>[<->[-]]<<<<<<"+ll+rd+"[-]-"+ld+rl+">>[<<"+ll+rd+"++"+ld+rl+">>-]>>>[<<<<<";
      r+=ll+rd+"+"+ld+rl+">>>>>-]<<<<<"+ll;
    }
    else if(c[i][0]=='a2b')//treats three registers as ascii digits and converts them to binary
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase()), o=reg.indexOf(c[i][3].toUpperCase()), d=reg.indexOf(c[i][4].toUpperCase());
      var la="<".repeat(a), ra=">".repeat(a), lb="<".repeat(b), rb=">".repeat(b), ld="<".repeat(d), rd=">".repeat(d), lo="<".repeat(o), ro=">".repeat(o), ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      var m='-'.repeat(48);
      r+=rl+"[-]>[-]>[-]<<"+ll+ro+"["+lo+rl+"+>+<"+ll+ro+"-]"+lo+rl+m+">[<"+ll+ro+"+"+lo+rl+">-]<"+ll;
      r+=ra+"["+la+rl+">+>+<<"+ll+ra+"-]"+la+rl+">>[<<"+ll+ra+"+"+la+rl+">>-]<"+m+"[<"+"+".repeat(100)+">-]<"+ll;
      r+=rb+"["+lb+rl+">+>+<<"+ll+rb+"-]"+lb+rl+">>[<<"+ll+rb+"+"+lb+rl+">>-]<"+m+"[<++++++++++>-]<"+ll;
      r+=rd+"[-]"+ld+rl+"["+ll+rd+"+"+ld+rl+"-]"+ll;
    }
    else if(c[i][0]=='b2a')//takes one character and converts it's charCode to an ascii number
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), h=reg.indexOf(c[i][2].toUpperCase()), t=reg.indexOf(c[i][3].toUpperCase()), o=reg.indexOf(c[i][4].toUpperCase());
      if(reg[a]==reg[a+1]||reg[h]==reg[h+1]||reg[t]==reg[t+1]||reg[o]==reg[o+1])
      //if ANY registers are lists
        throw "Lists are not vars!";
      var la="<".repeat(a), ra=">".repeat(a), lh="<".repeat(h), rh=">".repeat(h), lt="<".repeat(t), rt=">".repeat(t), lo="<".repeat(o), ro=">".repeat(o), ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      var pl="+".repeat(48);
      r+=rl+"[-]>[-]>[-]>[-]>[-]>[-]>[-]>[-]>[-]<<<<<<<<"+pl+ll+ra+"["+la+rl+">+>+<<"+ll+ra+"-]"+la+rl+">>[<<"+ll+ra+"+"+la+rl;
      r+=">>-]>++++++++++<<[->+>-[>+>>]>[+[-<+>]>+>>]<<<<<<]>>>[<<<<+>>>>-]<<<<"+ll+ro+"[-]"+lo+rl+"["+ll+ro+"+"+lo+rl+"-]";
      r+=">>[-]++++++++++>[-]>[-]>[<<<<<+>>>>>-]<<<<<[->+>-[>+>>]>[+[-<+>]>+>>]<<<<<<]"+ll+rt+"[-]"+lt;
      r+=rl+">>>"+pl+"[<<<"+ll+rt+"+"+lt+rl+">>>-]>"+pl+"<<<<"+ll+rh+"[-]"+lh+rl+">>>>[<<<<"+ll+rh+"+"+lh+rl+">>>>-]<<<<"+ll;
    }
    else if(c[i][0]=='lset')//lset a i n does a[i]=n, throws error if arguments are not correct types
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase()), x=reg.indexOf(c[i][3].toUpperCase());
      var la="<".repeat(a), ra=">".repeat(a);
      if(reg[a]!=reg[a+1])
        throw "Expected a list but got a variable!";
      if(b<0)
      {
        b=plusString(c[i][2]);
        r+=ra+">"+b+">"+b+"<<"+la;
      }
      else
      {
        var lb="<".repeat(b), rb=">".repeat(b);
        r+=rb+"["+lb+ra+"+>+>+<<"+la+rb+"-]"+lb+ra+"["+la+rb+"+"+lb+ra+"-]"+la;
      }
      if(x<0)
        r+=ra+">>>"+plusString(c[i][3])+"<<<"+la;
      else
      {
        if(reg[x]==reg[x+1])
          throw "Expected a variable but got a list!";
        var lx="<".repeat(x), rx=">".repeat(x);
        r+=rx+"["+lx+ra+"+>>>+<<<"+la+rx+"-]"+lx+ra+"["+la+rx+"+"+lx+ra+"-]"+la;
      }
      r+=ra+">[>>>[-<<<<+>>>>]<[->+<]<[->+<]<[->+<]>-]>>>[-]<[->+<]<[[-<+>]<<<[->>>>+<<<<]>>-]<<"+la;
    }
    else if(c[i][0]=='lget')//same as lset, except it's n=a[i]
    {
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase()), x=reg.indexOf(c[i][3].toUpperCase());
      var la="<".repeat(a), ra=">".repeat(a), lx="<".repeat(x), rx=">".repeat(x);
      if(reg[a]!=reg[a+1])//lists have all their indeces named the same, so these should equal
        throw "Expected a list but got a variable!";
      if(b<0)
      {
        b=plusString(c[i][2]);
        r+=ra+">"+b+">"+b+"<<"+la;
      }
      else
      {
        var lb="<".repeat(b), rb=">".repeat(b);
        r+=rb+"["+lb+ra+"+>+>+<<"+la+rb+"-]"+lb+ra+"["+la+rb+"+"+lb+ra+"-]"+la;
      }
      r+=rx+"[-]"+lx+ra+">[>>>[-<<<<+>>>>]<<[->+<]<[->+<]>-]>>>[-<+<<+>>>]<<<[->>>+<<<]>[[-<+>]>[-<+>]<<<<[->>>>+<<<<]>>-]>[<<<"
      r+=la+rx+"+"+lx+ra+">>>-]<<<"+la;
    }
    else if(c[i][0]=='wneq')//while not equals, easier than while equals because of BF
    {//first arg is assumed to be a register, second should be a number
      var m=plusString(-c[i][2]), pl=plusString(c[i][2]), a=reg.indexOf(c[i][1].toUpperCase());
      var la="<".repeat(a), ra=">".repeat(a), j=endEx(c, i);
      r+=ra+m+"["+pl+la+kcuf(c.slice(i+1, j), reg, p, true)+ra+m+"]"+pl+la;
      i=j;
    }
    else if(c[i][0]=='ifneq')//similar to wneq, except we zero out the value we check so loop terminates
    {//after a single iteration
      var a=reg.indexOf(c[i][1].toUpperCase()), b=reg.indexOf(c[i][2].toUpperCase()), j=endEx(c, i);
      var la="<".repeat(a), ra=">".repeat(a), ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      r+=rl+"[-]>[-]<"+ll+ra+"["+la+rl+"+>+<"+ll+ra+"-]"+la+rl+">[<"+ll+ra+"+"+la+rl+">-]<";
      if(b<0)
        r+=plusString(-c[i][2]);
      else
      {
        var lb="<".repeat(b), rb=">".repeat(b);
        r+=ll+rb+"["+lb+rl+"->+<"+ll+rb+"-]"+lb+rl+">[<"+ll+rb+"+"+lb+rl+">-]<";
      }
      r+="["+ll+kcuf(c.slice(i+1, j), reg, p, true)+rl+"[-]]"+ll;
      i=j;
    }
    else if(c[i][0]=='ifeq')//similar to ifneq, except we have a flag to determine whether
    {//ifneq was true or not so we know whether to run ifeq code
      var a=reg.indexOf(c[i][1].toUpperCase()), j=endEx(c, i), m=plusString(-c[i][2]);
      var la="<".repeat(a), ra=">".repeat(a), ll="<".repeat(reg.length), rl=">".repeat(reg.length);
      r+=rl+"[-]>[-]<"+ll+ra+"["+la+rl+"+>+<"+ll+ra+"-]"+la+rl+">[<"+ll+ra+"+"+la+rl+">-]+<";
      r+=m+"[>-<[-]]>[<"+ll+kcuf(c.slice(i+1, j), reg, p, true)+rl+">[-]]<"+ll;
      i=j;
    }
    else if(c[i][0]=='call')//replace calls with their actual code
    {
      var k=procInsert(p, c[i]), t=[];
      for(var j=1; j<p[k].length; j++)
        t.push(p[k][j].slice());//manually insert all the new code where call was
      r+=kcuf(t, reg, p, true);//similar to wneq, ifneq and ifeq, recursively evaluate inner code
    }
    else//will only get here if instruction could not be processed
      throw "Unknown instruction!";
  }
  return r;
}
/**
 * Given a value, v, return a number of plus signs based on the character code for letters OR the number provided
 * @param v The value to use
 */
function plusString(v)
{
  if(isNaN(v))//not a number
    if(v.length==3)//we assume it's a character in single quotes, like 'a' or 'Z'
      return "+".repeat(v.charCodeAt(1));//1 is middle character, which is the one that matters
    else//must be length 3 to be in above format
      throw "Unclosed '' pair!";
  v=+v;//v always starts as a String, but we know it's a number so convert it to one!
  while(v<0)//if they give us a negative value
    v+=256;//wrap it into the range [0, 255]
  return "+".repeat(v%256);//could've given us huge number, modulate to put it in correct range for BF
}
/**
 * Given code and an index to start at, find the corresponding "end" command for a command
 * such as wneq, ifneq or ifeq
 * @param c The code to parse
 * @param i The index to begin parsing at
 */
function endEx(c, i)
{
  var n=1;//we know we need to find one end
  for(i++; n>0; i++)//while we haven't grouped every ifeq or whatever with an 'end'
    if(c[i][0]=='wneq'||c[i][0]=='ifneq'||c[i][0]=='ifeq')//uh oh, better find more ends!
      n++;
    else if(c[i][0]=='end')
      n--;
  return i-1;//always goes one past the 'end' we want, subtract one to account for this
}
/**
 * Given a procedure and a line of code calling that procedure, replace all variables
 * used in the procedure to match those in the call statement so the procedure code
 * can be directly injected into the original code
 * @param p The procedures to pull from
 * @param c The line of code to base paramater names off of
 */
function procInsert(p, c)
{
  c[1]=c[1].toLowerCase();//this makes finding the correct procedure easier
  for(var i=0; i<p.length; i++)//go through all procedures
    if(p[i][0][1]==c[1])//if we found the right procedure
    {
      if(p[i][0].length!=c.length)//make sure we have enough parameters to call it!
        throw "Proc parameter mismatch!";
      for(var j=2; j<c.length; j++)//go through all parameters
      {
        c[j]=c[j].toUpperCase();//makes finding parameters easier
        for(var k=1; k<p[i].length; k++)//go through every line of the procedure
          for(var l=1; l<p[i][k].length; l++)//and every POSSIBLE instance of the reg to replace
            if(p[i][0][j]==p[i][k][l].toString().toUpperCase())//sometimes numbers sneak their way into procedures... Don't ask me how!
              p[i][k][l]=c[j];//replace the register name
      }
      for(var j=2; j<c.length; j++)//go through the first line of the procedure
        p[i][0][j]=c[j];//and replace its arguments since they're now irrelevant
      return i;//returns the index of the correct procedure in the procedure list
    }
}
NOPRINT = true//Set this to false if you want code to print on codewars