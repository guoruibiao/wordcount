'use strict';
import * as vscode from 'vscode';
import * as WebRequest from 'web-request';
import { isNumber } from 'util';
/** reference from: 
    wordcount: https://github.com/ycjcl868/vscode-wordcount
	webrequest: https://www.npmjs.com/package/web-request
	publish: https://www.cnblogs.com/liuxianan/p/vscode-plugin-publish.html
**/

export function activate(context : vscode.ExtensionContext) {
    console.log('Congratulations, your extension"wordcount"is now active!');

    const wordCounter = new WordCounter();

    let disposable = vscode.commands.registerCommand('extension.wordCount', () => {
        const count = wordCounter.updateWordCount();
		if (count){ // && count >= 0) {
            vscode.window.showInformationMessage(`字数：${count}`);
		}
    });

    context.subscriptions.push(wordCounter);
    context.subscriptions.push(disposable);
}

class WordCounter {
    // VSCode 底部状态栏
    private _statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    // 释放队列
    private _disposable: vscode.Disposable;
    // subscribe event
    constructor() {
        // 注册事件
        const subscriptions: vscode.Disposable[] = [];
        // 注册光标改变事件
        vscode.window.onDidChangeTextEditorSelection(this.updateWordCount, this, subscriptions);
        // 注册切换文件事件
        vscode.window.onDidChangeActiveTextEditor(this.updateWordCount, this, subscriptions);
        // 更新状态栏
        this.updateWordCount();
        // 需要释放的事件队列
        this._disposable = vscode.Disposable.from(...subscriptions);
    }
    // 获取编辑器及编辑内容的上下文
    public updateWordCount() {
        // 获取当前编辑器对象
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return false;
        }
        // 当前编辑对象
		const doc = editor.document;
		
		// 获取当前选中的文本
        if(!editor){
            return
        }
        let selection = editor.selection
		let text = editor.document.getText(selection)
		
        // 测试显示选中的文本
        console.log("搞到了选中的：" + text);
		this._translate(text);

       //if (doc.languageId === 'markdown') {
            const wordCount = this._getWordCount(doc);
            this._statusBarItem.text = `${wordCount} Words`;
            this._statusBarItem.show();
            return wordCount;
        //} else {
        //    this._statusBarItem.hide();
        //}
    }
    // 统计函数
    public _getWordCount(doc: vscode.TextDocument): number {
        // 当前编辑内容
        const docContent: string = doc.getText();
        const filterStr: string = docContent.replace(/\r\n/g, "\n");
        // 中文字数
        const chineseTotal: Array<string> = filterStr.match(/[\u4e00-\u9fa5]/g) || [];
        // 匹配单字字符
        const englishTotal: Array<string> = filterStr.match(/\b\w+\b/g) || [];
        // 匹配数字
        const digitalTotal: Array<string> = filterStr.match(/\b\d+\b/g) || [];

		// return "字数统计：中文["+chineseTotal+"], 英文["+englishTotal+"], 数字["+digitalTotal+"], 总长度["+docContent.length+"]";
        return (chineseTotal.length + (englishTotal.length - digitalTotal.length)) || 0;
	}
	
	public _translate(keyword: string): string {
		// 获取选中的文本
		let wcconfig = vscode.workspace.getConfiguration("wordcount");
        let url = wcconfig.transapi ? wcconfig.transapi : "http://api.qingyunke.com/api.php?key=free&appid=0&msg=" 
        // console.log(url);
		if(keyword && this._isValidKeyWord(keyword)) {
			url = url + encodeURI(keyword)
			WebRequest.get(url).then(resp => {
                try{
                    console.log(resp.content);
                    // vscode.window.showInformationMessage(resp.content);
                    let rep = JSON.parse(resp.content);
                    if(rep.content) {
                        let transret = rep.content;
                        this._statusBarItem.text = "[" + keyword + "]:" + transret;
                        // vscode.window.showInformationMessage("[" + keyword + "]:" + transret);
                        this._statusBarItem.show();
                    }
                }catch(error) {
                    console.log(error);
                }
			});
		}
		return "失败了~~~~(>_<)~~~~"
	}

	// 判断选中的文本是否为合法的翻译素材，比如链接类，纯符号类等就不予考虑
	public _isValidKeyWord(keyword: string): boolean {
		if(keyword == null || keyword == "") {
			return false;
		}
		if(keyword.startsWith("http")) {
			return false;
		}else if(isNumber(keyword)) {
			return false;
		}
		return true;
	}
    // 当插件禁用时
    dispose() {
        this._statusBarItem.dispose();
        this._disposable.dispose();
    }

}

// this method is called when your extension is deactivated
export function deactivate() {}