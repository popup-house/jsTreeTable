var com_github_culmat_jsTreeTable =  (function(){

	function depthFirst(tree, func, childrenAttr) {
		childrenAttr = childrenAttr || 'children'
		function i_depthFirst(node) {
			if (node[childrenAttr]) {
				$.each(node[childrenAttr], function(i, child) {
					i_depthFirst(child)
				})
			}
			func(node)
		}
		$.each(tree, function(i, root) {
			i_depthFirst(root)
		})
		return tree
	}
	
	/*
	 * make a deep copy of the object
	 */
	function copy(data){
		return JSON.parse(JSON.stringify(data))
	}
	
	function makeTree (data, idAttr, refAttr, childrenAttr) {
		var data_tmp = data
		idAttr = idAttr || 'id'
		refAttr = refAttr || 'parent'
		childrenAttr = childrenAttr || 'children'
	
		var byName = []
		$.each(data_tmp, function(i, entry) {
			byName[entry[idAttr]] = entry
		})
		var tree = []
		$.each(data_tmp, function(i, entry) {
			var parents = entry[refAttr]
			if(!$.isArray(parents)){
				parents = [parents]
			}
			if(parents.length == 0){
				tree.push(entry)
			} else {
				var inTree = false;
				$.each(parents, function(i,parentID){
					var parent = byName[parentID]
					if (parent) {
						if (!parent[childrenAttr]) {
							parent[childrenAttr] = []
						}
						if($.inArray(entry, parent[childrenAttr])< 0)
							parent[childrenAttr].push(entry)
						inTree = true
					} 
				})
				if(!inTree){
					tree.push(entry)
				}
			}
		})
		return tree
	}
	
	function renderTree(tree, childrenAttr, idAttr, attrs, renderer, tableAttributes) {
		childrenAttr = childrenAttr || 'children'
		idAttr = idAttr || 'id'
		tableAttributes = tableAttributes || {}
		var maxLevel = 0;
		var ret = []
	
		var table = $("<table>")
		$.each(tableAttributes, function(key, value){
			if(key == 'class' && value != 'jsTT') {
				table.addClass(value)
			} else {
				table.attr(key, value)			
			}
		})
		var thead = $("<thead>")
		var tr = $("<tr>")
		var tbody = $("<tbody>")
	
		table.append(thead)
		thead.append(tr)
		table.append(tbody)
		if (attrs) {
			$.each(attrs, function(attr, desc) {
				$(tr).append($('<th>' + desc + '</th>'))
			})
		} else {
			$(tr).append($('<th>' + idAttr + '</th>'))
			$.each(tree[0], function(key, value) {
				if (key != childrenAttr && key != idAttr)
					$(tr).append($('<th>' + key + '</th>'))
			})
		}
	
		function render(node, parent) {
			var tr = $("<tr>")
			$(tr).attr('data-tt-id', node[idAttr])
			$(tr).attr('data-tt-level', node['data-tt-level'])
			if(!node[childrenAttr] || node[childrenAttr].length == 0)
				$(tr).attr('data-tt-isleaf', true)
			else
				$(tr).attr('data-tt-isnode', true)
			if (parent) {
				$(tr).attr('data-tt-parent-id', parent[idAttr])
			}
			if (renderer) {
				renderer($(tr), node)
			}else if (attrs) {
				$.each(attrs, function(attr, desc) {
					$(tr).append($('<td>' + node[attr] + '</td>'))
				})
			} else {
				$(tr).append($('<td>' + node[idAttr] + '</td>'))
				$.each(node, function(key, value) {
					if (key != childrenAttr && key != idAttr && key != 'data-tt-level')
						$(tr).append($('<td>' + value + '</td>'))
				})
			}
			tbody.append(tr)
		}
	
		function i_renderTree(subTree, childrenAttr, level, parent) {
			maxLevel = Math.max(maxLevel, level)
			$.each(subTree, function(i, node) {
				node['data-tt-level'] = level
				render(node, parent)
				if (node[childrenAttr]) {
					$.each(node[childrenAttr], function(i, child) {
						i_renderTree([ child ], childrenAttr, level + 1, node)
					})
				}
			})
		}
		i_renderTree(tree, childrenAttr, 1)
		if (tree[0])
			tree[0].maxLevel = maxLevel
		return table
	}
	
	function attr2attr(nodes, attrs){
		$.each(nodes,  function(i, node) {
			$.each(attrs,  function(j, at) {
				node[at] = $(node).attr(at)
			})	
		})
		return nodes
	}
	
	function treeTable(table){
		table.addClass('jsTT')
		table.expandLevel = function (n) {
			$("tr[data-tt-level]", table).each(function(index) {
				var level = parseInt($(this).attr('data-tt-level'))
				if (level > n-1) {
					this.trCollapse(true)
				} else if (level == n-1){
					this.trExpand(true)
				}
			})
		}
		function getLevel(node){
			var level = node.attr('data-tt-level')
			if(level != undefined ) return parseInt(level)
			var parentID = node.attr('data-tt-parent-id')
			if( parentID == undefined){
				return 0
			} else {
				return getLevel($('tr[data-tt-id="'+parentID+'"]', table).first()) + 1
			} 
		}
		$("tr[data-tt-id]", table).each(function(i,node){
			node = $(node)
			node.attr('data-tt-level', getLevel(node)) 
		})
		var dat = $("tr[data-tt-level]", table).get()
		$.each(dat,  function(j, d) {
			d.trChildrenVisible = true
			d.trChildren = []
		})	
		dat  = attr2attr(dat, ['data-tt-id', 'data-tt-parent-id'])
		dat = makeTree(dat, 'data-tt-id', 'data-tt-parent-id', 'trChildren')
		
		var iconExpand = "fa-caret-down"
		var iconCollapse = "fa-caret-right"
		$("tr[data-tt-level]", table).each(function(index, tr) {
			var level = $(tr).attr('data-tt-level')
			var td = $("td",tr).first()
			if(tr.trChildren.length>0){
				td.prepend($('<i id="state" class="fa ' + iconCollapse + '" style="cursor:pointer;width:1em;height:1em;" aria-hidden="true"></i>'))
			}  else {
				td.prepend($('<span style="padding-left:16px;" /></span>'))
			}
			td.prepend($('<span style="padding-left:'+(15*parseInt(level-1))+'px;" /></span>'))
			td.css('white-space','nowrap')
			tr.trExpand = function(changeState){
				if(this.trChildren.length < 1) return
				if(changeState) {
					this.trChildrenVisible = true
					$('#state', this).removeClass(iconCollapse).addClass(iconExpand)
				} 
				var doit = changeState || this.trChildrenVisible
				$.each(this.trChildren, function(i, ctr) {
					if(doit) $(ctr).css('display', 'table-row')
					ctr.trExpand()
				})
			}
			tr.trCollapse = function(changeState){
				if(this.trChildren.length < 1) return
				if(changeState) {
					this.trChildrenVisible = false
                    $('#state', this).removeClass(iconExpand).addClass(iconCollapse)
				}
				$.each(this.trChildren, function(i, ctr) {
					$(ctr).css('display', 'none')
					ctr.trCollapse()
				})
			}
            $(tr).find('td:not(".quote-checkbox")').click(function() {
                this.parentNode.trChildrenVisible ? this.parentNode.trCollapse(true) : this.parentNode.trExpand(true)
			})
		})
		return table
	}
	
	
	function appendTreetable(tree, options) {
		function inALine(nodes) {
			var tr = $('<tr>')
			$.each(nodes, function(i, node){
				tr.append($('<td style="padding-right: 20px;">').append(node))
			})
			return $('<table border="0"/>').append(tr)
			
		}
		options = options || {}
		options.idAttr = (options.idAttr || 'id')
		options.childrenAttr = (options.childrenAttr || 'children')
		var controls = (options.controls || [])
	
		if (!options.mountPoint)
			options.mountPoint = $('body')
		
		if (options.depthFirst)
			depthFirst(tree, options.depthFirst, options.childrenAttr)
		var rendered = renderTree(tree, options.childrenAttr, options.idAttr,
				options.renderedAttr, options.renderer, options.tableAttributes)
	
		treeTable(rendered)
		if (options.replaceContent) {
			options.mountPoint.html('')
		}
		var initialExpandLevel = options.initialExpandLevel ? parseInt(options.initialExpandLevel) : -1
		initialExpandLevel = Math.min(initialExpandLevel, tree[0].maxLevel)
		rendered.expandLevel(initialExpandLevel)
		if(options.slider){
			var slider = $('<div style="margin-right: 15px;">')
			slider.width('200px')
			slider.slider({
				min : 1,
				max : tree[0].maxLevel,
				range : "min",
				value : initialExpandLevel,
				slide : function(event, ui) {
					rendered.expandLevel(ui.value)
				}
			})
			controls = [slider].concat(options.controls)
		}
		
	    if(controls.length >0){
	    	options.mountPoint.append(inALine(controls))    	
	    }
		options.mountPoint.append(rendered)
		return rendered
	}
	
	return {
		depthFirst : depthFirst,
		makeTree : makeTree,
		renderTree : renderTree,
		attr2attr : attr2attr,
		treeTable : treeTable,
		appendTreetable : appendTreetable,
		jsTreeTable : '1.1',
		register : function(target){
			$.each(this, function(key, value){ if(key != 'register') target[key] = value})
		}
	}
})();