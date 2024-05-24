我的ASP.net core服务端想要实现一个基于Redis存储

我需要在Redis里存入一个复杂对象，该对象其他属性都可以通过json化等形式存入，但是其中有五个属性Id，CreatorId，PlayerList（是Id的list）,JoinCode,IsCompleted
我有可能会根据这四个属性进行任意组合查询.

我的服务是多节点的,因此存在异步问题，我需要保证数据的一致性，因此我需要在Redis里存入一个锁，以保证数据的一致性
具体机制是,每个人想要访问这个对象的时候，都需要先获取这个锁，然后再进行操作，操作完毕后释放锁
我希望通过RedLock实现这个锁,但是想把他做成一个library，以便于其他代码使用

因此,我希望设计一个Class GameManager
提供
1. Task<Game> GetGameAsync(int gameId,bool readonly=true)
2. Task<List<Game>> GetGameByCreatorIdAsync(int creatorId,bool readonly=true)
3. Task<List<Game>> GetGameByPlayerIdAsync(int playerId,bool readonly=true)
3. Task<List<Game>> GetGameByJoinCodeAsync(int playerId,bool readonly=true)
上述方法,如果readonly=true,则不需要获取锁，否则需要获取锁,获取的锁只有5秒持续时间,超时后自动释放
锁不暴露给外部，会在SaveGameAsync释放.

2. Task<bool> SaveGameAsync(Game game)
用于保存Game,此处需要检查锁过期的问题
锁过期的情况下，需要重新获取锁，然后检查在这期间是否有数据变化,如果没有变化则保存，否则返回false
数据冲突的情况下，直接返回false
此外,如果是通过readonly=true获取的Game,则不允许保存,直接返回false

如果有必要,可以通过在Game里增加一个Version属性来探测数据冲突
添加一个参数用于标记是否是通过readonly=true获取的Game

请给出GameManager的类函数定义，先不需要给出实现,注意通过DI注入的方式获取Redis对象
使用StackExchange.Redis作为Redis客户端,RedLock.Net作为锁实现
