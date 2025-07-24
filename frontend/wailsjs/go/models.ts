export namespace main {
	
	export class ChatFile {
	    path: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new ChatFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.content = source["content"];
	    }
	}
	export class FileInfo {
	    name: string;
	    isDirectory: boolean;
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.isDirectory = source["isDirectory"];
	        this.path = source["path"];
	    }
	}

}

