


function numToFloatStr(v, keepDotZero)
{
	v = (+v).toFixed(6)
	v = v.replace(/0+$/, "")
	v = v.replace(/\.$/, keepDotZero ? ".0" : "")
	return v
}

const cc0 = "0".charCodeAt(0)
const cc9 = "9".charCodeAt(0)
const cca = "a".charCodeAt(0)
const ccz = "z".charCodeAt(0)
const ccA = "A".charCodeAt(0)
const ccZ = "Z".charCodeAt(0)
function isDigit(x, at)
{
	const cc = x.charCodeAt(at || 0)
	return cc >= cc0 && cc <= cc9
}
function isAlpha(x, at)
{
	const cc = x.charCodeAt(at || 0)
	return (cc >= cca && cc <= ccz) || (cc >= ccA && cc <= ccZ)
}

function Token(type, value, off, len)
{
	this.type = type
	this.value = value
	this.off = off
	this.len = len
}
const TokenType = Object.freeze
({
	IDENT:     "IDENT",
	NUMBER:    "NUMBER",
	LPAREN:    "LPAREN",
	RPAREN:    "RPAREN",
	COMMA:     "COMMA",
	NODE_REF:  "NODE_REF", // #<num>
	OP_MEMBER: "OP_MEMBER", // .
	OP_ADD:    "OP_ADD",
	OP_SUB:    "OP_SUB",
	OP_MUL:    "OP_MUL",
	OP_DIV:    "OP_DIV",
})
const TokenTypeNames = {}
for (var k in TokenType)
	TokenTypeNames[TokenType[k]] = k
const CHAR_TOKEN_MAP =
{
	"(": TokenType.LPAREN,
	")": TokenType.RPAREN,
	",": TokenType.COMMA,
	".": TokenType.OP_MEMBER,
	"+": TokenType.OP_ADD,
	"-": TokenType.OP_SUB,
	"*": TokenType.OP_MUL,
	"/": TokenType.OP_DIV,
}
const TOKEN_CHAR_MAP = {}
for (var ch in CHAR_TOKEN_MAP)
	TokenTypeNames[CHAR_TOKEN_MAP[ch]] = ch
function tokensToString(tokens, from, to)
{
	const strs = []
	for (var i = from; i < to; ++i)
	{
		if (tokens[i].type == TokenType.IDENT || tokens[i].type == TokenType.NUMBER)
			strs.push(tokens[i].value)
		else
			strs.push(TOKEN_CHAR_MAP[tokens[i].type])
	}
	return strs.join(" ")
}
function tokenize(str)
{
	const out = []
	var i = 0
	while (i < str.length)
	{
		var sctt = CHAR_TOKEN_MAP[str[i]]
		if (typeof sctt !== "undefined")
		{
			// single character token
			out.push(new Token(sctt, str[i], i, 1))
			i++
			continue
		}

		if (str[i] == " " || str[i] == "\t" || str[i] == "\r" || str[i] == "\n")
		{
			// whitespace
			i++
			continue
		}

		if (isDigit(str, i))
		{
			// number
			var start = i
			for ( ; i < str.length && isDigit(str, i); ++i);
			if (i < str.length && str[i] == ".")
			{
				i++
				for ( ; i < str.length && isDigit(str, i); ++i);
			}
			if (i < str.length && (str[i] == "e" || str[i] == "E"))
			{
				i++
				if (i >= str.length || (str[i] != "+" && str[i] != "-"))
					throw "expected + or - after e/E"
				i++
				var before = i
				for ( ; i < str.length && isDigit(str, i); ++i);
				if (i == before)
					throw "expected number after e/E and +/-"
			}
			out.push(new Token(TokenType.NUMBER, parseFloat(str.substring(start, i)), start, i - start))
			continue
		}

		if (str[i] == "#")
		{
			// node reference
			i++
			var start = i
			for ( ; i < str.length && isDigit(str, i); ++i);
			if (start == i)
				throw "expected number after '#'"
			out.push(new Token(TokenType.NODE_REF, parseInt(str.substring(start, i), 10), start, i - start))
			continue
		}

		if (str[i] == "_" || isAlpha(str, i))
		{
			// identifier
			var start = i
			for ( ; i < str.length; ++i)
			{
				if (str[i] == "_")
					continue
				if (isDigit(str, i))
					continue
				if (isAlpha(str, i))
					continue
				break
			}
			out.push(new Token(TokenType.IDENT, str.substring(start, i), start, i - start))
			continue
		}

		throw "unrecognized character: '" + str[i] + "'"
	}
	return out
}

const SPLITSCORE_RTLASSOC = 0x80

function tokenIsExprPreceding(tt)
{
	switch (tt)
	{
	case TokenType.IDENT:
	case TokenType.RPAREN:
	case TokenType.NUMBER:
	case TokenType.NODE_REF:
		return true;
	default:
		return false;
	}
}

function getSplitScore(tokens, pos, start)
{
	// http://en.cppreference.com/w/c/language/operator_precedence

	var tt = tokens[pos].type;

//	if (tt == STT_OP_Ternary) return 13 | SPLITSCORE_RTLASSOC;

	if (start < pos && tokenIsExprPreceding(tokens[pos - 1].type))
	{
//		if (tt == STT_OP_Eq || tt == STT_OP_NEq) return 7;
//		if (tt == STT_OP_Less || tt == STT_OP_LEq || tt == STT_OP_Greater || tt == STT_OP_GEq)
//			return 6;

		if (tt == TokenType.OP_ADD || tt == TokenType.OP_SUB) return 4;
		if (tt == TokenType.OP_MUL || tt == TokenType.OP_DIV) return 3;
	}

	// unary operators
	if (pos == start)
	{
		if (tt == TokenType.OP_ADD || tt == TokenType.OP_SUB)
			return 2 | SPLITSCORE_RTLASSOC;
	}

	if (start < pos)
	{
		// function call
		if (tt == TokenType.LPAREN) return 1;
	}

	// member operator
	if (tt == TokenType.OP_MEMBER) return 1;

	return -1;
}

function findBestSplit(tokens, curPos, to, endTT)
{
	var bestSplit = tokens.length
	var bestScore = 0
	var parenCount = 0
	var startPos = curPos
	while (curPos < to && ((tokens[curPos].type != TokenType.COMMA && tokens[curPos].type != endTT) || parenCount > 0))
	{
		if (parenCount == 0)
		{
			var curScore = getSplitScore(tokens, curPos, startPos)
			var rtl = (curScore & SPLITSCORE_RTLASSOC) != 0
			curScore &= ~SPLITSCORE_RTLASSOC
			if (curScore - (rtl ? 1 : 0) >= bestScore) // ltr: >=, rtl: > (-1)
			{
				bestScore = curScore
				bestSplit = curPos
			}
		}

		if (tokens[curPos].type == TokenType.LPAREN)
			parenCount++
		else if (tokens[curPos].type == TokenType.RPAREN)
		{
			if (parenCount == 0)
			{
				throw "brace mismatch (too many endings)"
			}
			parenCount--
		}

		curPos++
	}

	if (parenCount)
	{
		throw "brace mismatch (too many beginnings)"
	}

	return { at: curPos, bestSplit: bestSplit }
}

function IdentNode(name)
{
	this.name = name
}

function NodeRefNode(id)
{
	this.id = id
}

function NumberNode(num)
{
	this.num = num
}

function PropertyNode(src, prop)
{
	this.src = src
	this.prop = prop
}

function FuncNode(func, args)
{
	this.func = func
	this.args = args
}

function parseASTNode(tokens, from, to)
{
	if (from >= to)
		throw "empty expression"
	var split = findBestSplit(tokens, from, to, 0)

	if (split.bestSplit == tokens.length)
	{
		if (split.at - from == 1)
		{
			// one item long expression
			if (tokens[from].type == TokenType.IDENT)
			{
				return new IdentNode(tokens[from].value)
			}
			else if (tokens[from].type == TokenType.NODE_REF)
			{
				return new NodeRefNode(tokens[from].value)
			}
			else if (tokens[from].type == TokenType.NUMBER)
			{
				return new NumberNode(tokens[from].value)
			}
		}
		if (tokens[from].type == TokenType.LPAREN && tokens[split.at - 1].type == TokenType.RPAREN)
		{
			return parseASTNode(tokens, from + 1, split.at - 1)
		}
		throw "unexpected subexpression: " + tokensToString(tokens, from, split.at) //+ "|" + split.at + "|" + from
	}

	var ttSplit = tokens[split.bestSplit].type;
	if (from < split.bestSplit && ttSplit == TokenType.LPAREN)
	{
		if (from + 1 == split.bestSplit && tokens[from].type == TokenType.IDENT && tokens[split.at - 1].type == TokenType.RPAREN)
		{
			// function call
			const args = []
			const funcName = tokens[from].value
			from += 2 // right after first LPAREN
			to = split.at - 1 // until ending RPAREN
			while (from < to && tokens[from].type != TokenType.RPAREN)
			{
				// find next comma
				var parenCount = 0
				var nc = from
				while (nc < to)
				{
					if (tokens[nc].type == TokenType.COMMA)
					{
						if (parenCount == 0)
							break
					}
					else if (tokens[nc].type == TokenType.LPAREN)
						parenCount++
					else if (tokens[nc].type == TokenType.RPAREN)
					{
						if (parenCount == 0)
						{
							throw "brace mismatch (too many endings)"
						}
						parenCount--
					}
					nc++
				}
				if (parenCount)
				{
					throw "brace mismatch (too many beginnings)"
				}

				args.push(parseASTNode(tokens, from, nc))
				from = nc

				if (tokens[from].type != TokenType.RPAREN)
				{
					if (tokens[from].type != TokenType.COMMA)
						throw "expected ','"
					if (++from >= to)
						throw "unexpected end of subexpression"
				}
			}
			return new FuncNode(funcName, args)
		}
		else throw "expected function call"
	}
	else if (from == split.bestSplit && ttSplit == TokenType.LPAREN && tokens[split.at - 1].type == TokenType.RPAREN)
	{
		return parseASTNode(tokens, from + 1, split.at - 1)
	}
	/* TODO
	else if (from < split.bestSplit && ttSplit == TokenType.TERNARY)
	{
	}*/
	else
	{
		if (split.bestSplit == from)
		{
			if (ttSplit == TokenType.OP_ADD)
			{
				return parseASTNode(tokens, split.bestSplit + 1, to)
			}
			if (ttSplit == TokenType.OP_SUB)
			{
				return new FuncNode("u-",
				[
					parseASTNode(tokens, split.bestSplit + 1, to),
				])
			}
		}

		if (ttSplit == TokenType.OP_MEMBER)
		{
			if (split.at - split.bestSplit == 2 && tokens[split.bestSplit + 1].type == TokenType.IDENT)
			{
				return new PropertyNode(parseASTNode(tokens, from, split.bestSplit), tokens[split.bestSplit + 1].value)
			}
			throw "expected identifier after '.'"
		}
		else
		{
			var op = null
			switch (ttSplit)
			{
			case TokenType.OP_ADD: op = "b+"; break
			case TokenType.OP_SUB: op = "b-"; break
			case TokenType.OP_MUL: op = "b*"; break
			case TokenType.OP_DIV: op = "b/"; break
			}
			if (op !== null)
			{
				return new FuncNode(op,
				[
					parseASTNode(tokens, from, split.bestSplit),
					parseASTNode(tokens, split.bestSplit + 1, to),
				])
			}
		}
	}
	throw "unhandled case"
}

function parseAST(str)
{
	tokens = tokenize(String(str))
	return parseASTNode(tokens, 0, tokens.length)
}



function evaluateNode(node)
{
	if (node instanceof NumberNode)
		return node.num
	if (node instanceof IdentNode)
	{
		if (node.name == "pi")
			return Math.PI
		if (node.name == "e")
			return Math.E
		throw "unknown identifier"
	}
	if (node instanceof FuncNode)
	{
		switch (node.func)
		{
		case "u-": return -evaluateNode(node.args[0])
		case "b+": return evaluateNode(node.args[0]) + evaluateNode(node.args[1])
		case "b-": return evaluateNode(node.args[0]) - evaluateNode(node.args[1])
		case "b*": return evaluateNode(node.args[0]) * evaluateNode(node.args[1])
		case "b/": return evaluateNode(node.args[0]) / evaluateNode(node.args[1])
		}
	}
	throw "unhandled case"
}

function calculate(str)
{
	try
	{
		var node = parseAST(str)
		var v = evaluateNode(node)
		return isFinite(v) ? numToFloatStr(v) : "0"
	}
	catch (ex)
	{
		console.log(ex)
	}
	return 0
}


