import XCTest
import SwiftTreeSitter
import TreeSitterWren

final class TreeSitterWrenTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_wren())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Wren grammar")
    }
}
