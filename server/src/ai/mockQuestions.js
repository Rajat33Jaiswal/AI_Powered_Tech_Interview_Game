export const mockQuestions = {
  DSA: [
    {
      questionText: "What is the time complexity of searching for an element in a balanced Binary Search Tree (BST) in the average case?",
      questionType: "MCQ",
      options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
      correctAnswer: "O(log n)",
      explanation: "A balanced BST splits the search space in half with each comparison, resulting in a logarithmic time complexity."
    },
    {
      questionText: "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
      questionType: "MCQ",
      options: ["Queue", "Stack", "Heap", "Linked List"],
      correctAnswer: "Stack",
      explanation: "A Stack pushes elements on top and pops them from the top, following LIFO behavior."
    },
    {
      questionText: "Explain the main differences between a Tree and a Graph.",
      questionType: "short",
      correctAnswer: "A tree is a connected acyclic graph. In a tree, there is exactly one path between any two vertices, and it always has a hierarchical structure with a single root. A graph can have cycles, disconnected components, and has no concept of a root.",
      explanation: "Trees are a restricted subset of graphs that are connected, directed or undirected, and do not contain cycles."
    },
    {
      questionText: "What is the worst-case time complexity of the Quick Sort algorithm?",
      questionType: "MCQ",
      options: ["O(n log n)", "O(n)", "O(n^2)", "O(2^n)"],
      correctAnswer: "O(n^2)",
      explanation: "The worst case occurs when the pivot consistently partitions the array into one empty subarray and another containing n-1 elements (e.g., when the array is already sorted and the first or last element is chosen as pivot)."
    },
    {
      questionText: "What is a hash collision in a Hash Table, and what are two common methods to resolve it?",
      questionType: "short",
      correctAnswer: "A hash collision occurs when two different keys hash to the same index. Common resolution methods include Chaining (using a linked list or bucket at each index) and Open Addressing (Linear Probing, Quadratic Probing, or Double Hashing to find an empty slot).",
      explanation: "Since the hash space is smaller than the key space, collisions are inevitable and must be handled using resolution techniques."
    },
    {
      questionText: "Which tree traversal algorithm visits nodes in ascending order when applied to a Binary Search Tree?",
      questionType: "MCQ",
      options: ["Pre-order", "In-order", "Post-order", "Level-order"],
      correctAnswer: "In-order",
      explanation: "In-order traversal visits the left subtree, then the root, and finally the right subtree, which processes elements in sorted order for a BST."
    },
    {
      questionText: "Explain dynamic programming and how it differs from a simple recursive approach.",
      questionType: "short",
      correctAnswer: "Dynamic programming solves complex problems by breaking them down into overlapping subproblems, solving each subproblem once, and storing their solutions (memoization/tabulation) to avoid redundant computations. A simple recursive approach might recompute the same subproblems repeatedly, leading to exponential time complexity.",
      explanation: "Dynamic programming trades memory space for execution speed by remembering previously computed results."
    },
    {
      questionText: "What is the space complexity of the Merge Sort algorithm in its standard implementation?",
      questionType: "MCQ",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correctAnswer: "O(n)",
      explanation: "Merge Sort requires an auxiliary array of size n to merge the sorted sub-arrays, making its helper space complexity O(n)."
    },
    {
      questionText: "Describe how a Binary Search Tree (BST) stores elements and how searching works.",
      questionType: "short",
      correctAnswer: "A BST is a node-based binary tree where each node has at most two children. The left subtree of a node contains only nodes with keys lesser than the node's key, and the right subtree contains only nodes with keys greater than it. Searching starts at the root; if the target is smaller, search continues in the left child, and if larger, in the right child.",
      explanation: "The structural property of BST allows search operations to discard half of the tree at each level in balanced cases."
    },
    {
      questionText: "Which data structure is typically used to implement Breadth-First Search (BFS)?",
      questionType: "MCQ",
      options: ["Stack", "Queue", "Priority Queue", "Deqeue"],
      correctAnswer: "Queue",
      explanation: "BFS explores nodes level-by-level, making a First-In, First-Out (FIFO) queue the perfect structure to track visited but unexplored nodes."
    }
  ],
  OS: [
    {
      questionText: "What is the primary purpose of virtual memory in an operating system?",
      questionType: "MCQ",
      options: [
        "To speed up hard drive access",
        "To allow execution of processes larger than the physical RAM",
        "To store bootloader configurations",
        "To run multi-threaded processes simultaneously"
      ],
      correctAnswer: "To allow execution of processes larger than the physical RAM",
      explanation: "Virtual memory maps virtual addresses used by a program into physical addresses in computer memory, using paging or swapping to disk when RAM is full."
    },
    {
      questionText: "Explain the main differences between a process and a thread.",
      questionType: "short",
      correctAnswer: "A process is an independent execution unit with its own address space, memory, file descriptors, and security context. A thread is a subset of a process (a lightweight process) that shares the parent process's memory space, code, and resources, but has its own stack and registers.",
      explanation: "Processes are isolated from each other and expensive to create; threads share resources and have lower creation overhead but require synchronization to avoid race conditions."
    },
    {
      questionText: "Which CPU scheduling algorithm can suffer from the 'convoy effect'?",
      questionType: "MCQ",
      options: [
        "Round Robin",
        "Shortest Job First (SJF)",
        "First-Come, First-Served (FCFS)",
        "Priority Scheduling"
      ],
      correctAnswer: "First-Come, First-Served (FCFS)",
      explanation: "In FCFS, a long, CPU-bound process can delay many short, I/O-bound processes behind it, leading to poor CPU utilization and response times (the convoy effect)."
    },
    {
      questionText: "What is a deadlock, and what are the four Coffman conditions necessary for a deadlock to occur?",
      questionType: "short",
      correctAnswer: "A deadlock is a state where a set of processes are blocked because each process holds a resource and waits for another resource held by some other process. The four Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
      explanation: "Deadlock occurs only if all four conditions hold simultaneously. Preventing any one of these conditions resolves the possibility of deadlock."
    },
    {
      questionText: "What is the main role of a Page Table in an Operating System?",
      questionType: "MCQ",
      options: [
        "To track files open on the file system",
        "To map virtual addresses to physical page frames",
        "To schedule process execution order",
        "To manage cache memory replacement policy"
      ],
      correctAnswer: "To map virtual addresses to physical page frames",
      explanation: "A page table is a data structure used by the Memory Management Unit (MMU) to store the mapping between a process's virtual addresses and physical memory pages."
    },
    {
      questionText: "What is context switching, and why is it considered computationally expensive?",
      questionType: "short",
      correctAnswer: "Context switching is the process of storing the state (context) of a CPU-bound process or thread so that it can be restored and resume execution later. It is expensive because it involves saving/loading registers, updating program counters, altering MMU state, flushing CPU caches, and scheduler overhead, during which no useful application work is done.",
      explanation: "Context switching is essential for multitasking but introduces overhead that operating systems try to minimize."
    },
    {
      questionText: "Which of the following is NOT a standard process state?",
      questionType: "MCQ",
      options: ["New", "Running", "Waiting", "Compiling"],
      correctAnswer: "Compiling",
      explanation: "The standard process states are New, Ready, Running, Waiting (or Blocked), and Terminated."
    },
    {
      questionText: "Explain the difference between Paging and Segmentation.",
      questionType: "short",
      correctAnswer: "Paging is a memory management scheme that divides physical memory into fixed-size blocks (frames) and logical memory into blocks of the same size (pages), which is invisible to the programmer. Segmentation divides logical memory into variable-sized segments based on user perspective (e.g., functions, stack, variables), which is visible to the programmer.",
      explanation: "Paging avoids external fragmentation by using fixed sizes, while segmentation reflects logical partitions of a program."
    },
    {
      questionText: "What is thrashing in the context of operating system memory management?",
      questionType: "MCQ",
      options: [
        "Deleting temporary cache files automatically",
        "A state where the CPU spends more time swapping pages in/out than executing instructions",
        "Optimizing disk storage through defragmentation",
        "A system crash due to hardware overheating"
      ],
      correctAnswer: "A state where the CPU spends more time swapping pages in/out than executing instructions",
      explanation: "Thrashing occurs when the active pages of running processes exceed physical RAM, causing the system to constantly page-fault and swap memory to disk."
    },
    {
      questionText: "What is a semaphore, and how does it help manage concurrency?",
      questionType: "short",
      correctAnswer: "A semaphore is an integer variable used for signaling and solving critical section problems in concurrent systems. It is accessed via two atomic operations: wait() (decrements value, blocks if negative) and signal() (increments value, wakes up a blocked process). Binary semaphores act as mutex locks, while counting semaphores manage access to a finite pool of resources.",
      explanation: "Semaphores provide synchronization primitives to coordinate access to shared resources and prevent race conditions."
    }
  ],
  DBMS: [
    {
      questionText: "What does the 'I' stand for in the ACID properties of database transactions?",
      questionType: "MCQ",
      options: ["Consistency", "Isolation", "Integrity", "Indexation"],
      correctAnswer: "Isolation",
      explanation: "ACID stands for Atomicity, Consistency, Isolation, and Durability. Isolation ensures that concurrently executing transactions do not interfere with each other."
    },
    {
      questionText: "Explain the primary differences between SQL and NoSQL databases.",
      questionType: "short",
      correctAnswer: "SQL databases are relational, table-based, use a structured schema, and are optimized for complex queries and ACID compliance (vertical scaling). NoSQL databases are non-relational, schema-less, use document, key-value, graph, or column store formats, and are designed for high scalability, flexibility, and horizontal partitioning.",
      explanation: "The choice depends on data structure consistency requirements, scalability needs, and queries complexity."
    },
    {
      questionText: "Which normal form requires the elimination of transitive dependencies?",
      type: "MCQ",
      options: ["First Normal Form (1NF)", "Second Normal Form (2NF)", "Third Normal Form (3NF)", "Boyce-Codd Normal Form (BCNF)"],
      correctAnswer: "Third Normal Form (3NF)",
      explanation: "For a table to be in 3NF, it must be in 2NF and have no transitive dependencies (non-prime attributes must depend only on the primary key, not on other non-prime attributes)."
    },
    {
      questionText: "What is a database index, and what are its advantages and disadvantages?",
      questionType: "short",
      correctAnswer: "An index is a data structure (typically a B-Tree or Hash index) that speeds up data retrieval operations on a database table. Advantages: significantly faster SELECT query performance. Disadvantages: occupies additional disk space, and slows down write operations (INSERT, UPDATE, DELETE) since the index must be updated.",
      explanation: "Indexes trade write speed and storage space for read performance."
    },
    {
      questionText: "Which JOIN operation returns all rows from the left table, and the matched rows from the right table?",
      questionType: "MCQ",
      options: ["INNER JOIN", "RIGHT JOIN", "LEFT JOIN", "FULL OUTER JOIN"],
      correctAnswer: "LEFT JOIN",
      explanation: "A LEFT JOIN (or LEFT OUTER JOIN) returns all records from the left table, and matching records from the right table; missing right values are returned as NULL."
    },
    {
      questionText: "Explain the concept of a database transaction and what a rollback does.",
      questionType: "short",
      correctAnswer: "A transaction is a single logical unit of database work containing one or more SQL statements. A rollback aborts an ongoing transaction and restores the database to its state prior to the start of the transaction, ensuring that partial modifications are never committed, thus maintaining data integrity.",
      explanation: "Transactions guarantee Atomicity, ensuring either all operations succeed or none do."
    },
    {
      questionText: "What is the difference between a Primary Key and a Foreign Key?",
      questionType: "MCQ",
      options: [
        "Primary Keys allow duplicate values; Foreign Keys do not",
        "Primary Key uniquely identifies records in a table; Foreign Key links tables by referencing a primary key in another table",
        "A table can have multiple Primary Keys but only one Foreign Key",
        "Primary Keys are used in NoSQL; Foreign Keys are used in SQL"
      ],
      correctAnswer: "Primary Key uniquely identifies records in a table; Foreign Key links tables by referencing a primary key in another table",
      explanation: "Primary keys ensure entity integrity within a table; foreign keys enforce referential integrity between tables."
    },
    {
      questionText: "Describe the difference between the WHERE clause and the HAVING clause in SQL.",
      questionType: "short",
      correctAnswer: "The WHERE clause filters rows BEFORE any grouping (GROUP BY) takes place and cannot be used with aggregate functions (like SUM or AVG). The HAVING clause filters grouped records AFTER the GROUP BY operation and is specifically used to filter results based on aggregate functions.",
      explanation: "WHERE operates on individual records, while HAVING operates on grouped aggregates."
    },
    {
      questionText: "Which of the following is NOT an relational database management system?",
      questionType: "MCQ",
      options: ["PostgreSQL", "MySQL", "Oracle", "MongoDB"],
      correctAnswer: "MongoDB",
      explanation: "MongoDB is a document-based NoSQL database, while MySQL, PostgreSQL, and Oracle are relational database management systems (RDBMS)."
    },
    {
      questionText: "What is database normalization and why is it performed?",
      questionType: "short",
      correctAnswer: "Database normalization is the process of structuring a relational database in accordance with a series of normal forms to reduce data redundancy and improve data integrity. It aims to eliminate insertion, update, and deletion anomalies by dividing large tables into smaller tables and defining relationships between them.",
      explanation: "Normalization organizes columns and tables to ensure that dependencies are properly enforced."
    }
  ],
  Java: [
    {
      questionText: "Which of the following is NOT one of the four core pillars of Object-Oriented Programming?",
      questionType: "MCQ",
      options: ["Abstraction", "Inheritance", "Compilation", "Polymorphism"],
      correctAnswer: "Compilation",
      explanation: "The four pillars of OOP are Abstraction, Encapsulation, Inheritance, and Polymorphism."
    },
    {
      questionText: "Explain the differences between JVM, JRE, and JDK.",
      questionType: "short",
      correctAnswer: "JVM (Java Virtual Machine) is the abstract machine that runs Java bytecode. JRE (Java Runtime Environment) includes the JVM plus the standard libraries and files required to run Java applications. JDK (Java Development Kit) is a full software development environment that includes JRE plus development tools like the compiler (javac) and debugger.",
      explanation: "JDK is for developers, JRE is for running programs, and JVM is the engine that executes bytecode."
    },
    {
      questionText: "Is it possible to instantiate an abstract class in Java?",
      questionType: "MCQ",
      options: [
        "Yes, using the new keyword directly",
        "No, abstract classes cannot be instantiated, only subclassed",
        "Yes, but only if it contains no methods",
        "Yes, using static reflection"
      ],
      correctAnswer: "No, abstract classes cannot be instantiated, only subclassed",
      explanation: "Abstract classes are incomplete designs and cannot be instantiated. However, they can contain constructors called by subclass instances."
    },
    {
      questionText: "Explain the differences between final, finally, and finalize in Java.",
      questionType: "short",
      correctAnswer: "final is a keyword used to declare constant variables, prevent method overriding, and prevent inheritance. finally is a block used in try-catch-finally statements to execute code (like cleanup) regardless of whether an exception is thrown. finalize() is a protected method of the Object class called by the garbage collector before reclaiming an object (now deprecated).",
      explanation: "These three words have completely distinct functions: final represents restriction, finally represents execution guarantee, and finalize is garbage collection hooks."
    },
    {
      questionText: "Which Java Collection Framework interface allows duplicate elements and maintains insertion order?",
      questionType: "MCQ",
      options: ["Set", "Map", "List", "Queue"],
      correctAnswer: "List",
      explanation: "The List interface allows duplicate elements and keeps them ordered based on when they were inserted (e.g., ArrayList, LinkedList)."
    },
    {
      questionText: "How does Garbage Collection work in Java?",
      questionType: "short",
      correctAnswer: "Java Garbage Collection (GC) is an automatic process that runs on the JVM to identify and delete unused objects in memory (heap), freeing up space. It works by tracking object reachability from GC Roots (e.g., stack frames, static variables). Unreachable objects are marked and swept. The heap is divided into Young, Old, and Permanent generations to optimize garbage collection cycles.",
      explanation: "Garbage collection relieves developers from manual memory allocation and deallocation."
    },
    {
      questionText: "Is Java a pass-by-value or pass-by-reference language?",
      questionType: "MCQ",
      options: [
        "Always pass-by-reference",
        "Always pass-by-value",
        "Pass-by-value for primitives, pass-by-reference for objects",
        "Depends on the compiler settings"
      ],
      correctAnswer: "Always pass-by-value",
      explanation: "Java is strictly pass-by-value. When an object reference is passed to a method, a copy of the reference address itself is passed by value, not the actual reference itself."
    },
    {
      questionText: "Explain the difference between Checked and Unchecked Exceptions in Java.",
      questionType: "short",
      correctAnswer: "Checked exceptions are checked at compile-time and must be declared in a method's throws clause or handled in a try-catch block (inherit from Exception but not RuntimeException). Unchecked exceptions (inheriting from RuntimeException) are checked at runtime, representing programming errors like NullPointerException, and do not need compile-time handling.",
      explanation: "Checked exceptions represent recoverable external conditions; unchecked exceptions represent programmer errors."
    },
    {
      questionText: "Which interface must be implemented to create a thread by passing it to the Thread class constructor?",
      questionType: "MCQ",
      options: ["Callable", "Runnable", "Serializable", "Cloneable"],
      correctAnswer: "Runnable",
      explanation: "Implementing the Runnable interface and its run() method is the standard way to define a thread task without extending the Thread class."
    },
    {
      questionText: "What is the difference between String, StringBuilder, and StringBuffer in Java?",
      questionType: "short",
      correctAnswer: "String objects are immutable (cannot be modified after creation, modifying creates new strings). StringBuilder is mutable and not thread-safe (higher performance for single-thread scenarios). StringBuffer is mutable and thread-safe because its methods are synchronized, making it suitable for multi-threaded operations but slower.",
      explanation: "Immutability is key for String; mutability determines StringBuilder vs StringBuffer based on concurrency needs."
    }
  ],
  WebDev: [
    {
      questionText: "What does HTML stand for?",
      questionType: "MCQ",
      options: [
        "Hyperlinks and Text Markup Language",
        "Hyper Text Markup Language",
        "Home Tool Markup Language",
        "Hyperlink Transfer Markup Language"
      ],
      correctAnswer: "Hyper Text Markup Language",
      explanation: "HTML is the standard markup language for creating web pages."
    },
    {
      questionText: "Explain the differences between Client-Side Rendering (CSR) and Server-Side Rendering (SSR).",
      questionType: "short",
      correctAnswer: "In CSR, the browser downloads a minimal HTML shell and a large Javascript bundle which executes and builds the DOM dynamically in the client's browser (e.g. standard React). In SSR, the server runs Javascript to pre-render the full HTML page with data and sends it directly to the browser, which parses it immediately (e.g. Next.js), providing faster initial load and better SEO.",
      explanation: "CSR shifts CPU load to client browsers; SSR shifts it to servers to improve load times and SEO indexability."
    },
    {
      questionText: "Which HTTP method is specifically designed to perform partial modifications to a resource?",
      questionType: "MCQ",
      options: ["PUT", "POST", "PATCH", "DELETE"],
      correctAnswer: "PATCH",
      explanation: "PATCH is used for partial updates, whereas PUT is typically used to replace the entire resource representation."
    },
    {
      questionText: "What is Cross-Origin Resource Sharing (CORS), and why is it enforced?",
      questionType: "short",
      correctAnswer: "CORS is a security mechanism enforced by web browsers that restricts web pages from making HTTP requests to a domain different from the one that served the web page. It is enforced to prevent malicious sites from reading sensitive data from another domain (e.g., executing cross-site requests using active session credentials). Servers configure CORS headers to permit trusted origins.",
      explanation: "CORS is a browser-enforced security barrier to prevent unauthorized cross-domain data access."
    },
    {
      questionText: "Which CSS layout module is designed to handle two-dimensional layouts (both columns and rows simultaneously)?",
      questionType: "MCQ",
      options: ["Flexbox", "Float", "CSS Grid", "Table Layout"],
      correctAnswer: "CSS Grid",
      explanation: "CSS Grid is a powerful 2D grid-based layout system, while Flexbox is primarily a 1D layout system (either rows OR columns)."
    },
    {
      questionText: "Explain the differences between LocalStorage, SessionStorage, and Cookies.",
      questionType: "short",
      correctAnswer: "LocalStorage stores key-value pairs in the browser with no expiration date (data persists until manually cleared, size ~5MB). SessionStorage stores data for the duration of the page session (cleared when the tab is closed, size ~5MB). Cookies store small key-value pairs (~4KB) that are sent with every HTTP request to the server, useful for auth session tokens and tracking.",
      explanation: "LocalStorage is for persistent client data; SessionStorage is for tab-scoped data; Cookies are for server-readable data."
    },
    {
      questionText: "Which HTTP status code represents 'Unauthorized' access?",
      questionType: "MCQ",
      options: ["400 Bad Request", "401 Unauthorized", "403 Forbidden", "404 Not Found"],
      correctAnswer: "401 Unauthorized",
      explanation: "401 Unauthorized means the request lacks valid authentication credentials for the target resource. (403 Forbidden means the user is authenticated but lacks permission)."
    },
    {
      questionText: "Explain the Event Loop in JavaScript.",
      questionType: "short",
      correctAnswer: "The Event Loop is a mechanism that allows JavaScript to perform non-blocking I/O operations despite being single-threaded. It constantly monitors the Call Stack and the Callback Queue. If the Call Stack is empty, it takes the first task from the queue (e.g. from setTimeout or promise callbacks) and pushes it onto the Call Stack to be executed.",
      explanation: "The event loop coordinates execution, events, user interactions, and database callbacks."
    },
    {
      questionText: "Which of the following is a popular CSS preprocessor?",
      questionType: "MCQ",
      options: ["Webpack", "Sass", "Babel", "Vite"],
      correctAnswer: "Sass",
      explanation: "Sass (Syntactically Awesome Style Sheets) is a stylesheet language that compiles into CSS, offering features like variables, nested rules, and mixins."
    },
    {
      questionText: "What is the Virtual DOM, and how does React use it to optimize rendering?",
      questionType: "short",
      correctAnswer: "The Virtual DOM is a lightweight, in-memory representation of the real DOM. When component state changes, React creates a new virtual DOM tree, compares it with the previous one (a process called 'diffing'), and calculates the minimal set of changes needed. It then applies only those changes to the real browser DOM in a single batch, minimizing expensive re-layouts.",
      explanation: "By minimizing writes to the real browser DOM, React achieves high rendering performance."
    }
  ],
  OOP: [
    {
      questionText: "Which OOP concept is defined as wrapping data and code into a single unit and restricting direct access?",
      questionType: "MCQ",
      options: ["Inheritance", "Polymorphism", "Encapsulation", "Abstraction"],
      correctAnswer: "Encapsulation",
      explanation: "Encapsulation is the bundling of data and the methods that operate on that data, hiding internal state details using access modifiers."
    },
    {
      questionText: "What is the difference between Method Overloading and Method Overriding?",
      questionType: "short",
      correctAnswer: "Method overloading (compile-time polymorphism) occurs when two or more methods in the same class have the same name but different parameters. Method overriding (runtime polymorphism) occurs when a subclass provides a specific implementation of a method that is already defined in its superclass, sharing the same name, parameters, and return type.",
      explanation: "Overloading is resolved at compile time; overriding is resolved at runtime."
    },
    {
      questionText: "Which pillar of OOP allows a subclass to inherit attributes and methods from a superclass?",
      questionType: "MCQ",
      options: ["Encapsulation", "Polymorphism", "Inheritance", "Composition"],
      correctAnswer: "Inheritance",
      explanation: "Inheritance enables reusability by allowing a child class to inherit fields and behaviors from a parent class."
    },
    {
      questionText: "Explain the OOP concept of Polymorphism and give a real-world example.",
      questionType: "short",
      correctAnswer: "Polymorphism means 'many forms'. It allows objects of different classes to be treated as objects of a common superclass. For example, a superclass 'Animal' might have a method 'makeSound()'. Subclasses like 'Dog' (woof) and 'Cat' (meow) implement this method differently, and calling 'makeSound()' on an 'Animal' reference executes the correct subclass implementation dynamically at runtime.",
      explanation: "Polymorphism enables writing code that can execute differently based on the type of object it is working with."
    },
    {
      questionText: "What does the Single Responsibility Principle (SRP) in SOLID design principles state?",
      questionType: "MCQ",
      options: [
        "A class should have only one reason to change, meaning it should perform only one job",
        "A class should only have one instance globally",
        "Inheritance should be restricted to a single parent class",
        "An interface should only declare one method"
      ],
      correctAnswer: "A class should have only one reason to change, meaning it should perform only one job",
      explanation: "Single Responsibility Principle asserts that every class should solve one precise problem or handle one system responsibility."
    }
  ],
  SystemDesign: [
    {
      questionText: "Which component is used to distribute incoming network traffic across a group of backend servers?",
      questionType: "MCQ",
      options: ["Database Index", "Load Balancer", "Web Server", "Message Queue"],
      correctAnswer: "Load Balancer",
      explanation: "Load balancers sit between clients and servers to distribute incoming traffic evenly, preventing any single server from becoming a bottleneck."
    },
    {
      questionText: "Explain the difference between Vertical Scaling (scaling up) and Horizontal Scaling (scaling out).",
      questionType: "short",
      correctAnswer: "Vertical scaling (scaling up) means adding more power (CPU, RAM, Storage) to an existing single server. Horizontal scaling (scaling out) means adding more machines/servers to the resource pool and distributing requests among them, which is more resilient and scalable for high-traffic systems.",
      explanation: "Vertical scaling has hardware limits and single points of failure; horizontal scaling scales virtually limitlessly using load balancing."
    },
    {
      questionText: "What does the CAP Theorem state about distributed database systems?",
      questionType: "MCQ",
      options: [
        "A distributed system can guarantee Consistency, Availability, and Partition Tolerance simultaneously",
        "A distributed system can only guarantee at most two out of Consistency, Availability, and Partition Tolerance",
        "Consistency is more important than Availability",
        "Databases must use ACID compliance in horizontal architectures"
      ],
      correctAnswer: "A distributed system can only guarantee at most two out of Consistency, Availability, and Partition Tolerance",
      explanation: "The CAP Theorem states that in the event of a network partition, a distributed system must choose between Consistency (all nodes see same data) or Availability (every request receives a non-error response)."
    },
    {
      questionText: "Describe what a Cache is, its benefits, and what a cache invalidation strategy is.",
      questionType: "short",
      correctAnswer: "A cache is a high-speed data storage layer (like Redis) that stores a subset of transient data, reducing database hits. Benefits include low latency and reduced database load. Invalidation strategies (like Cache-Aside, Write-Through, or Time-To-Live expiration) ensure the cached data is kept consistent with the primary database when database writes occur.",
      explanation: "Caching improves application speed but requires invalidation logic to prevent stale data reads."
    },
    {
      questionText: "Which architecture pattern splits an application into small, independent, and loosely coupled services?",
      questionType: "MCQ",
      options: ["Monolith", "Microservices", "Model-View-Controller (MVC)", "Serverless"],
      correctAnswer: "Microservices",
      explanation: "Microservices architecture structures an application as a collection of autonomous, single-purpose services communicating via APIs."
    }
  ]
};
