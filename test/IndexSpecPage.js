/** IndexSpecPage
 *
 * author: jbroglio
 * Date: 5/15/14
 * Time: 4:57 PM
 */

var FileSpecPage = require('./FileSpecPage.js').FileSpecPage
    , util = require('util')
    , child = require('child_process')
    , fs = require('fs')
    ;

exports.IndexSpecPage = function (core, path, should) {
    var self = this;
    var filePage = new FileSpecPage(core, path, should);
    var argv = {
        _: ['N/A'],
        config: path.resolve(__dirname, '../examples/index-es-config.js'),
        level: 'error',
        clean: true
    };
    var argvInline = {
        _: ['N/A'],
        config: {
            index: {
                name: 'testxml__',
                type: 'doc',  // must match one of the types in mapping
                settings: {index: {number_of_shards: 1}},
                mapping: path.join(__dirname, '../examples/mapping.json'),
                ext: '.json',
                server: 'localhost',
                port: 9200,
                clean: true
            }
        },
        level: 'error'
    };
    self.testIndexSingleObject = function (done) {
        var config = filePage.makeJsonInlineConfig(filePage.simpleFile);
        var indexer = new core.ElasticIndexer(core.resolveIndexOptions(argvInline));
        config.generator = function (json, cb) {
            if (filePage.jsonDone(json))
                return cb ? cb() : done ? done() : null;
            indexer.putMapping(function (err) {
                should.not.exist(err);
                indexer.submitObject(json, 'N/A', function (err) {
                    should.not.exist(err);
                    // callback since only one file
                    indexer.deleteIndex(cb || done);
                });
            });
        };

        indexer.deleteIndex(indexer.getConfig().index.url, function (err) {
            if (err) return true.should.be.false();

            new core.Parser(config).processFiles(done);
        });
    };

    // question should we just test file here
    self.testIndexAggregateFile = function (done) {
        // use child procs and call on files
        var indexDir = path.resolve(process.cwd(), 'jsonTest');
        if (fs.existsSync(indexDir)) {
            fs.readdirSync(indexDir, function (f) {
                fs.unlinkSync(path.join(indexDir, f));
            });
        } else fs.mkdirSync(indexDir);
        var config = filePage.makeJsonConfig(filePage.goodTags, {output: {destDir: indexDir, docsPerFile: 0}});
        var indexer = new core.ElasticIndexer(core.resolveIndexOptions(
            {
                _: [indexDir],
                level: "WARN",
                config: argv.config,
                clean: true
            }));
        indexer.deleteIndex(indexer.getConfig().index.url, function (err) {
            if (err) return true.should.be.false();

            new core.Parser(config).processFiles(function (err) {
                if (err) return done ? done() : null;
                indexer.putMapping(function (e) {
                    should.not.exist(e);
                    // give time to make sure parser write is done. todo: making writestream async is tough, but try it.
                    indexer.putFiles([indexDir], function (e1) {
                        should.not.exist(e1);
                        indexer.getDocumentCount(function (e2, json) {
                            should.not.exist(e2);
                            should.exist(json);
                            should.exist(json.count);
                            json.count.should.be.greaterThan(0);
                            indexer.deleteIndex(done);
                        });
                    });
                });
            });
        });
    };
};