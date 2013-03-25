/*用简单质朴的思维、设计、创意、方法去解决复杂的问题...
侯锋博客
模块的封装与解耦

话题起因

回头看自已写过东西，常会感觉到不满意，总有重构冲动（其实这种冲动通常是好事，因为只有发现了不足才有重构想法，只有重构才能改进，只有改进才能完善）。

最近，准备重构mokit，因为这前的mokit虽然有将不同的“模块”分离在不同的文件中，并有“命名空间”概念，但其实现在版本的mokit模块甚至不能称为真正的模块，因为它没有完整“封装”的概念，并且虽有“命名空间”，但还是会创建一部分全局变量，只能依靠开发人员制定好的“契约”，既“非强制约束”的开发规范。

因为现有mokit存在的各种不足，在重构之前一直在思考mokit更合适的结构：

更加清析的、真正的模块化的结构；
模块的真正封装；
模块间的最大化解耦；
更加清析的MVC或MVP模式；
第一步先实现真的模块封装，及模块中的解耦，第二步实现简洁易用的MVC或MVP的架构及开框架。MVC稍后再谈，这篇博文将就模块化、封装、解耦做一些控讨。

模块的封装

百度百科:

模块化是指解决一个复杂问题时自顶向下逐层把系统划分成若干模块的过程，有多种属性，分别反映其内部特性 模块化是一种处理复杂系统分解为更好的可管理模块的方式。

模块化用来分割，组织和打包软件。每个模块完成一个特定的子功能，所有的模块按某种方法组装起来，成为一个整体，完成整个系统所要求的功能。 模块具有以下几种基本属性：接口、功能、逻辑、状态，功能、状态与接口反映模块的外部特性，逻辑反映它的内部特性。 在系统的结构中，模块是可组合、分解和更换的单元。模块化是一种处理复杂系统分解成为更好的可管理模块的方式。它可以通过在不同组件设定不同的功能，把一个问题分解成多个小的独立、互相作用的组件，来处理复杂、大型的软件。

实现模块封装:

在完整面向对象的语言中可能是一个类，封装作为OOP三大特性：封装、多态、继承之一，在这些有完整OOP机制的语言实现模块的封装非常容易

如在C#中

public class User
{
    private string Ident{get;set;}
    public string Name{get;set;}
}
在C#中，一个类（模块）可以方便的声明“私有成员”，实现封装特性；

而在JavaScript中实现就稍显“麻烦”，而且写法是各种各样，如下：

var Module1=(function(){
    var ident="";
    var name="";
    return {
        getName:function(){
            return name;
        }
    };
})();
上边在JavaScript的自执行函数中，通过var定议的变量，在函数外部不能被访问也实现了封装。 事实上，JavaScript的有很多模块化的库，能够实现更加完整的模块定义，如RequireJS、EmsJs。

模块的依赖

当程序采用模块化的结构后，不同的功能都分布在不同的模块中，必然存在模块相互调用的问题，这时就需要管理好模块之间的依赖关系；

依赖常常表直观的表现为：

在一个包中import另一个包；
在一个类中调用另一个类或存在加一个类的引用；
在一个js文件中用别一个js文件中定议的对象或函数；
如在C#中：

public calss A
{
    public string Name {get;set;}
}

public class B
{
    private A _a=new A();
    public A a
    {
        get
        {
            return _a;
        }
    }
    public string Name {get;set;}
}
如上代码类“B”事实上对类“A”存在“依赖”，在没有A的时候，B是不完整的，是无法使用的；当要替换A的时候需重新编写B，这样其实A、B之间的“耦合”非常高。

这里是假设每一个类就是一个模块，其实，上有时模块的粒度不能到一个类一个模块，我们也不需要每一个类都要“解耦”，但是上边的示例代码，却能“高耦合”的代码带的的问题；

我曾见过一定情况下很“二”的写法：

public interface IA
{
    string Name{get;set;}
}
public class A : IA
{
    string Name{get;set;}
}
public class B
{
    private IA _a=new A();
    public IA a
    {
        get
        {
            return _a;
        }
        set{
            _a=value;
        }
    }
    public string Name {get;set;}
}
如上，或许写代码的人一定是想用interface实现A、B间的“解耦”，实际上还不到位，B对A的依赖依然存在，没有任何意义；

模块间的解耦

依赖反转:

在面向对象编程领域中，依赖反转原则（Dependency inversion principle）指代了一种特定的解耦（传统的依赖关系建立在高层次上，而具体的策略设置则应用在低层次的模块上）形式。在这种形势下，为了使得高层次的模块不依赖于低层次的模块的实现细节的目的，依赖模块被颠倒了（例如：反转）。该原则规定： 高层次的模块不应该依赖于低层次的模块，两者都应该依赖于抽象接口。 抽象接口不应该依赖于具体实现。而具体实现则应该依赖于抽象接口。 该原则颠倒了一部分人对于面向对象设计的认识方式，比如高层次和低层次对象都应该应该依赖于相同的抽象接口

改掉这很“二”的写法，如下：

public interface IA
{
    string Name{get;set;}
}
public class A : IA
{
    string Name{get;set;}
}
public class B
{
    private IA _a=null;
    public IA a
    {
        get
        {
            if(_a==null)
            {
                throw new Exception("IA没有找到");
            }
            return _a;
        }
        set{
            _a=value;
        }
    }
    public string Name {get;set;}
}
这B、A没有强制依赖了，在更换A的时间，也无须动B中的代码，或许我们是用B前的某一个地主将IA的一个实现类实例传给了B，也有可能是基于配置文件及“反射”完成的。

比如，一个插件式的应用程序！



github > twitter > atom >
Power by Houfeng - 管理*/
define(function(require, exports, module) {
	var name = 'b';
	test('模块' + name, function() {
		ok(true, '进入' + name + '模块声名函数');
	});

	return {
		name: name,
		say: function(x) {
			ok(true, '模块' + name + ',say:' + x);
		}
	};
});